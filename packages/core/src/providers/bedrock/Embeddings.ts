/**
 * Bedrock Embeddings Handler
 *
 * Executes embedding requests against the Bedrock InvokeModel API.
 */

import { EmbeddingRequest, EmbeddingResponse } from "../Provider.js";
import { BedrockConfig, validateBedrockConfig, getBedrockEndpoint } from "./config.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TitanEmbeddingRequest {
  inputText: string;
  dimensions?: number;
  normalize?: boolean;
}

interface TitanEmbeddingResponse {
  embedding: number[];
  inputTextTokenCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Embeddings Handler
// ─────────────────────────────────────────────────────────────────────────────

export class BedrockEmbeddings {
  private readonly config: BedrockConfig;
  private readonly authMode: "apiKey" | "sigv4";
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.authMode = validateBedrockConfig(config);
    this.baseUrl = getBedrockEndpoint(config.region);
  }

  /**
   * Execute an embedding request against Bedrock InvokeModel API.
   */
  async execute(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const modelId = request.model ?? "amazon.titan-embed-text-v2:0";
    const url = `${this.baseUrl}/model/${modelId}/invoke`;

    // Handle single vs multiple inputs (Titan only supports one at a time via InvokeModel)
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const results: number[][] = [];
    let totalTokens = 0;

    // Bedrock InvokeModel API for Titan embeddings processes one text at a time.
    // We iterate through inputs and collect embeddings.
    for (const text of inputs) {
      const body: TitanEmbeddingRequest = {
        inputText: text,
        // Titan V2 supports 256, 512, 1024 dimensions. NodeLLM doesn't have a standardized field for this yet,
        // so we use the model's default (typically 1024 for V2) unless passed in headers/custom.
        normalize: true
      };

      const bodyJson = JSON.stringify(body);
      const headers = this.buildHeaders(url, bodyJson);

      logger.logRequest("BedrockEmbeddings", "POST", url, body);

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
        logger.logResponse("BedrockEmbeddings", response.status, response.statusText, errorText);
        throw new Error(`Bedrock Embeddings error (${response.status}): ${errorText}`);
      }

      const json = (await response.json()) as TitanEmbeddingResponse;
      results.push(json.embedding);
      totalTokens += json.inputTextTokenCount;
    }

    return {
      vectors: results,
      model: modelId!,
      input_tokens: totalTokens,
      dimensions: results[0]?.length || 0
    };
  }

  /**
   * Build request headers based on auth mode.
   */
  private buildHeaders(url: string, body: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    if (this.authMode === "apiKey") {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else {
      const credentials: AwsCredentials = {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
        sessionToken: this.config.sessionToken
      };

      const signedHeaders = signRequest({
        method: "POST",
        url,
        body: body,
        credentials,
        region: this.config.region!,
        service: "bedrock"
      });

      headers["host"] = signedHeaders.host!;
      headers["x-amz-date"] = signedHeaders["x-amz-date"]!;
      headers["x-amz-content-sha256"] = signedHeaders["x-amz-content-sha256"]!;
      headers["Authorization"] = signedHeaders.authorization!;

      if (signedHeaders["x-amz-security-token"]) {
        headers["x-amz-security-token"] = signedHeaders["x-amz-security-token"];
      }
    }

    return headers;
  }
}
