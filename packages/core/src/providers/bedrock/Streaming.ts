/**
 * Bedrock Streaming Handler
 *
 * Handles streaming responses from Bedrock ConverseStream API.
 * Parses the AWS EventStream binary format to extract JSON chunks.
 */

import { ChatRequest, ChatChunk, Usage } from "../Provider.js";
import { BedrockConfig, validateBedrockConfig, getBedrockEndpoint } from "./config.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";
import { buildConverseRequest } from "./mapper.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

export class BedrockStreaming {
  private readonly config: BedrockConfig;
  private readonly authMode: "apiKey" | "sigv4";
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.authMode = validateBedrockConfig(config);
    this.baseUrl = getBedrockEndpoint(config.region);
  }

  async *execute(request: ChatRequest, controller?: AbortController): AsyncGenerator<ChatChunk> {
    const internalController = new AbortController();
    const abortController = controller || internalController;
    const signal = request.signal ? (request.signal as AbortSignal) : abortController.signal;
    const currentToolCalls: Map<number, { id: string; name: string; input: string }> = new Map();
    let currentReasoning = "";

    const modelId = request.model;

    const url = `${this.baseUrl}/model/${modelId}/converse-stream`;

    const guardrail =
      this.config.guardrailIdentifier && this.config.guardrailVersion
        ? {
            guardrailIdentifier: this.config.guardrailIdentifier,
            guardrailVersion: this.config.guardrailVersion
          }
        : undefined;

    const body = buildConverseRequest(request.messages, request.tools, {
      maxTokens: request.max_tokens,
      temperature: request.temperature,
      thinking: request.thinking,
      guardrail,
      additionalModelRequestFields: request.additionalModelRequestFields as Record<string, any>
    });

    const bodyJson = JSON.stringify(body);
    const headers = this.buildHeaders(url, bodyJson, request.headers);

    logger.logRequest("Bedrock", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body: bodyJson,
        signal
      },
      request.requestTimeout ?? this.config.requestTimeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.logResponse("Bedrock", response.status, response.statusText, errorText);
      throw new Error(`Bedrock Streaming Error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from Bedrock streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = new Uint8Array(0);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append new data to buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;

        // Parse messages from buffer
        while (buffer.length >= 12) {
          const totalLength = new DataView(buffer.buffer, buffer.byteOffset, 4).getUint32(0);

          if (totalLength < 16 || totalLength > 1024 * 1024) {
            // Safety check: skip if total length is unreasonable
            logger.error(`Bedrock stream: invalid total length ${totalLength}`);
            buffer = buffer.slice(4);
            continue;
          }

          if (buffer.length < totalLength) {
            break; // Wait for more data
          }

          const headersLength = new DataView(buffer.buffer, buffer.byteOffset + 4, 4).getUint32(0);

          if (headersLength + 16 > totalLength) {
            logger.error(
              `Bedrock stream: invalid headers length ${headersLength} for total length ${totalLength}`
            );
            buffer = buffer.slice(totalLength);
            continue;
          }

          const payloadLength = totalLength - headersLength - 16;
          const payloadOffset = 12 + headersLength;

          const payload = buffer.slice(payloadOffset, payloadOffset + payloadLength);
          const chunkJson = decoder.decode(payload);

          try {
            const event = JSON.parse(chunkJson);
            const chatChunk = this.parseEvent(
              event,
              currentToolCalls,
              (text) => {
                currentReasoning += text;
              },
              modelId
            );
            if (chatChunk) {
              yield chatChunk;
            }
          } catch (e) {
            // Might be a binary event or malformed JSON (though Bedrock uses JSON in payload)
            logger.debug("Failed to parse Bedrock event payload", { chunkJson, error: e });
          }

          // Advance buffer
          buffer = buffer.slice(totalLength);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Parse a Bedrock ConverseStream event into a NodeLLM ChatChunk.
   */
  private parseEvent(
    event: any,
    toolCalls: Map<number, { id: string; name: string; input: string }>,
    onReasoning: (text: string) => void,
    modelId: string
  ): ChatChunk | null {
    // Bedrock ConverseStream events can be wrapped or unwrapped depending on model/service version
    const contentBlockStart = event.contentBlockStart;
    const contentBlockDelta = event.contentBlockDelta || (event.delta ? event : null);
    const contentBlockStop = event.contentBlockStop;
    const messageStop = event.messageStop || (event.stopReason ? event : null);
    const metadata = event.metadata || (event.usage ? event : null);

    // 1. Content Block Start (Initialize tools or reasoning)
    if (contentBlockStart) {
      const { contentBlockIndex, start } = contentBlockStart;
      if (start?.toolUse) {
        toolCalls.set(contentBlockIndex, {
          id: start.toolUse.toolUseId,
          name: start.toolUse.name,
          input: ""
        });
      }
      if (start?.reasoningContent) {
        return { content: "", thinking: { text: "" }, reasoning: "" };
      }
    }

    // 2. Content Block Delta (Accumulate text, tools, or reasoning)
    if (contentBlockDelta) {
      const delta = contentBlockDelta.delta || contentBlockDelta;
      const contentBlockIndex = contentBlockDelta.contentBlockIndex ?? 0;

      if (delta.text) {
        return { content: delta.text };
      }

      if (delta.reasoningContent?.text) {
        onReasoning(delta.reasoningContent.text);
        return {
          content: "",
          thinking: { text: delta.reasoningContent.text },
          reasoning: delta.reasoningContent.text
        };
      }

      if (delta.toolUse) {
        const toolCall = toolCalls.get(contentBlockIndex);
        if (toolCall) {
          toolCall.input += delta.toolUse.input;
          return null;
        }
      }
    }

    // 3. Content Block Stop (Finalize tool calls)
    if (contentBlockStop) {
      const { contentBlockIndex } = contentBlockStop;
      const toolCall = toolCalls.get(contentBlockIndex);
      if (toolCall) {
        toolCalls.delete(contentBlockIndex);
        return {
          content: "",
          tool_calls: [
            {
              id: toolCall.id,
              type: "function",
              function: {
                name: toolCall.name,
                arguments: toolCall.input
              }
            }
          ]
        };
      }
    }

    // 4. Message Stop
    if (event.messageStop) {
      return {
        content: "",
        done: true,
        finish_reason: event.messageStop.stopReason
      };
    }

    // 5. Metadata (Usage)
    if (event.metadata && event.metadata.usage) {
      const rawUsage: Usage = {
        input_tokens: event.metadata.usage.inputTokens,
        output_tokens: event.metadata.usage.outputTokens,
        total_tokens: event.metadata.usage.totalTokens,
        cached_tokens: event.metadata.usage.cacheReadInputTokens,
        cache_creation_tokens: event.metadata.usage.cacheWriteInputTokens
      };

      const usage = ModelRegistry.calculateCost(rawUsage, modelId, "bedrock");
      const metadata = event.metadata.trace ? { trace: event.metadata.trace } : undefined;

      return { content: "", usage, done: true, metadata };
    }

    return null;
  }

  private buildHeaders(
    url: string,
    body: string,
    additionalHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...additionalHeaders
    };

    if (this.authMode === "apiKey") {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else {
      const signedHeaders = signRequest({
        method: "POST",
        url,
        body,
        credentials: {
          accessKeyId: this.config.accessKeyId!,
          secretAccessKey: this.config.secretAccessKey!,
          sessionToken: this.config.sessionToken
        },
        region: this.config.region,
        service: "bedrock"
      });

      headers["host"] = signedHeaders.host;
      headers["x-amz-date"] = signedHeaders["x-amz-date"];
      headers["x-amz-content-sha256"] = signedHeaders["x-amz-content-sha256"];
      headers["Authorization"] = signedHeaders.authorization;
      if (signedHeaders["x-amz-security-token"]) {
        headers["x-amz-security-token"] = signedHeaders["x-amz-security-token"];
      }
    }

    return headers;
  }
}
