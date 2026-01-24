/**
 * Bedrock Chat Handler
 *
 * Executes chat requests against the Bedrock Converse API.
 */

import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { ToolCall } from "../../chat/Tool.js";
import { BedrockConfig, validateBedrockConfig, getBedrockEndpoint } from "./config.js";
import { BedrockConverseResponse, BedrockContentBlock } from "./types.js";
import { buildConverseRequest } from "./mapper.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Chat Handler
// ─────────────────────────────────────────────────────────────────────────────

export class BedrockChat {
  private readonly config: BedrockConfig;
  private readonly authMode: "apiKey" | "sigv4";
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.authMode = validateBedrockConfig(config);
    this.baseUrl = getBedrockEndpoint(config.region);
  }

  /**
   * Execute a chat request against Bedrock Converse API.
   */
  async execute(request: ChatRequest): Promise<ChatResponse> {
    const modelId = request.model;

    const url = `${this.baseUrl}/model/${modelId}/converse`;

    // Build the Bedrock request body
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

    // Build headers based on auth mode
    const headers = this.buildHeaders(url, bodyJson, request.headers);

    logger.logRequest("Bedrock", "POST", url, body);

    // Make the request
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body: bodyJson
      },
      request.requestTimeout ?? this.config.requestTimeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.logResponse("Bedrock", response.status, response.statusText, errorText);

      let message = errorText;

      // Improve clarity for known AWS errors
      if (errorText.includes("INVALID_PAYMENT_INSTRUMENT")) {
        message =
          "Billing setup incomplete for AWS Marketplace models. Ensure a credit card is set as default payment method.";
      } else if (
        errorText.includes("AccessDeniedException") &&
        errorText.includes("model access")
      ) {
        message =
          "Access denied for this model. Ensure you have requested and been granted access in the AWS Bedrock console (Model Access section).";
      } else if (errorText.includes("ThrottlingException")) {
        message = "Bedrock API throttling. Too many requests. Please retry with backoff.";
      } else if (errorText.includes("ValidationException")) {
        message = `Bedrock validation error: ${errorText}`;
      }

      throw new Error(`Bedrock API error (${response.status}): ${message}`);
    }

    const json = (await response.json()) as BedrockConverseResponse;
    logger.logResponse("Bedrock", response.status, response.statusText, json);

    const result = this.parseResponse(json);

    if (result.usage) {
      result.usage = ModelRegistry.calculateCost(result.usage, modelId, "bedrock");
    }

    return result;
  }

  /**
   * Build request headers based on auth mode.
   */
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
      // Simple Bearer token auth
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else {
      // SigV4 signing
      const credentials: AwsCredentials = {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
        sessionToken: this.config.sessionToken
      };

      const signedHeaders = signRequest({
        method: "POST",
        url,
        body,
        credentials,
        region: this.config.region,
        service: "bedrock"
      });

      // Merge signed headers
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

  /**
   * Parse Bedrock response to NodeLLM format.
   */
  private parseResponse(response: BedrockConverseResponse): ChatResponse {
    const message = response.output.message;
    let content: string | null = null;
    let thinkingText: string | null = null;
    const toolCalls: ToolCall[] = [];

    // Process content blocks
    for (const block of message.content) {
      if (block.text) {
        content = content ? content + block.text : block.text;
      }

      if (block.reasoningContent?.text) {
        thinkingText = thinkingText
          ? thinkingText + block.reasoningContent.text
          : block.reasoningContent.text;
      }

      if (block.toolUse) {
        toolCalls.push({
          id: block.toolUse.toolUseId,
          type: "function",
          function: {
            name: block.toolUse.name,
            arguments: JSON.stringify(block.toolUse.input)
          }
        });
      }
    }

    // Build usage info
    const usage: Usage = {
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
      total_tokens: response.usage.totalTokens,
      cached_tokens: response.usage.cacheReadInputTokens,
      cache_creation_tokens: response.usage.cacheWriteInputTokens
    };

    return {
      content,
      thinking: thinkingText ? { text: thinkingText } : undefined,
      reasoning: thinkingText || undefined, // Keep deprecated field for compat
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage,
      finish_reason: response.stopReason,
      metadata: response.trace ? { trace: response.trace } : undefined
    };
  }
}
