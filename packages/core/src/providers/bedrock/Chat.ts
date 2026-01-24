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
    let modelId = request.model;

    // Normalize model ID for regional inference profiles if needed.
    // Newer models (Claude 3.5 etc) often require regional prefixes (e.g. 'us.')
    // to work with on-demand throughput via Cross-Region Inference.
    if (modelId.startsWith("anthropic.") && !/^[a-z]{2}\./.test(modelId)) {
      const region = this.config.region;
      const prefix = region.split("-")[0]; // 'us', 'eu', 'ap' etc
      if (prefix) {
        modelId = `${prefix}.${modelId}`;
      }
    }

    const url = `${this.baseUrl}/model/${modelId}/converse`;

    // Build the Bedrock request body
    const body = buildConverseRequest(request.messages, request.tools, {
      maxTokens: request.max_tokens,
      temperature: request.temperature,
      thinking: request.thinking
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
      }

      throw new Error(`Bedrock API error (${response.status}): ${message}`);
    }

    const json = (await response.json()) as BedrockConverseResponse;
    logger.logResponse("Bedrock", response.status, response.statusText, json);

    return this.parseResponse(json);
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
    let reasoning: string | null = null;
    const toolCalls: ToolCall[] = [];

    // Process content blocks
    for (const block of message.content) {
      if (block.text) {
        content = content ? content + block.text : block.text;
      }

      if (block.reasoningContent?.text) {
        reasoning = reasoning
          ? reasoning + block.reasoningContent.text
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
      total_tokens: response.usage.totalTokens
    };

    return {
      content,
      reasoning: reasoning || undefined,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage
    };
  }
}
