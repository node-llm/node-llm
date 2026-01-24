/**
 * Bedrock Models Handler
 *
 * Lists and normalizes models from the Bedrock management API.
 */

import { BedrockConfig, validateBedrockConfig } from "./config.js";
import { BedrockListModelsResponse, BedrockModelSummary } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { ModelInfo } from "../Provider.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";

export class BedrockModels {
  private readonly config: BedrockConfig;
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    validateBedrockConfig(config);
    // Management API uses a different subdomain than the runtime API
    this.baseUrl = `https://bedrock.${config.region}.amazonaws.com`;
  }

  /**
   * List and normalize foundation models.
   */
  async execute(): Promise<ModelInfo[]> {
    const url = `${this.baseUrl}/foundation-models`;
    const body = ""; // GET request

    const credentials: AwsCredentials = {
      accessKeyId: this.config.accessKeyId!,
      secretAccessKey: this.config.secretAccessKey!,
      sessionToken: this.config.sessionToken
    };

    const signedHeaders = signRequest({
      method: "GET",
      url,
      body,
      credentials,
      region: this.config.region,
      service: "bedrock"
    });

    logger.logRequest("Bedrock", "GET", url);

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        ...signedHeaders,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.logResponse("Bedrock", response.status, response.statusText, errorText);
      throw new Error(`Bedrock Models API error (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as BedrockListModelsResponse;
    logger.logResponse("Bedrock", response.status, response.statusText, json);

    return this.parseResponse(json);
  }

  /**
   * Parse Bedrock model list into NodeLLM format.
   */
  private parseResponse(response: BedrockListModelsResponse): ModelInfo[] {
    const summaries = response.modelSummaries || [];

    // Filter and map models
    // We primarily focus on models that support text conversation (Converse API)
    return summaries.filter((m) => this.shouldIncludeModel(m)).map((m) => this.mapToModel(m));
  }

  /**
   * Determine if a model should be included in the NodeLLM models list.
   */
  private shouldIncludeModel(summary: BedrockModelSummary): boolean {
    const modelId = summary.modelId;

    // We only support Claude, DeepSeek, Mistral, Llama, and Titan for now.
    // Exclude embedding models and image models unless we strictly want to list them.
    const isSupportedFamily =
      modelId.includes("anthropic.claude") ||
      modelId.includes("deepseek") ||
      modelId.includes("mistral") ||
      modelId.includes("meta.llama") ||
      modelId.includes("amazon.nova") ||
      modelId.includes("amazon.titan-text") ||
      modelId.includes("amazon.titan-embed");

    return isSupportedFamily;
  }

  /**
   * Map summary to Model info.
   */
  private mapToModel(summary: BedrockModelSummary): ModelInfo {
    const modelId = summary.modelId;
    const normalizedId = this.normalizeModelId(summary);

    const capabilities = Capabilities.getCapabilities(modelId);
    const pricing = Capabilities.getPricing(modelId);
    const contextWindow = Capabilities.getContextWindow(modelId);
    const maxTokens = Capabilities.getMaxOutputTokens(modelId);

    return {
      id: normalizedId,
      name: summary.modelName || Capabilities.formatDisplayName(modelId),
      provider: "bedrock",
      family: Capabilities.getModelFamily(modelId),
      context_window: contextWindow,
      max_output_tokens: maxTokens,
      modalities: {
        input: summary.inputModalities || ["text"],
        output: summary.outputModalities || ["text"]
      },
      capabilities,
      pricing,
      metadata: {
        bedrock_model_id: modelId,
        provider_name: summary.providerName,
        inference_types: summary.inferenceTypesSupported || [],
        streaming_supported: summary.responseStreamingSupported || false
      }
    };
  }

  /**
   * Normalize model ID for inference profiles if supported.
   * Handles regional prefixes for Cross-Region Inference.
   */
  private normalizeModelId(summary: BedrockModelSummary): string {
    const modelId = summary.modelId;
    const types = summary.inferenceTypesSupported || [];

    // If it supports INFERENCE_PROFILE but NOT ON_DEMAND directly,
    // it likely requires the regional prefix.
    const needsPrefix = types.includes("INFERENCE_PROFILE") && !types.includes("ON_DEMAND");

    if (needsPrefix) {
      const region = this.config.region;
      const prefix = region.split("-")[0]; // 'us', 'eu', 'ap'
      if (prefix && !/^[a-z]{2}\./.test(modelId)) {
        return `${prefix}.${modelId}`;
      }
    }

    return modelId;
  }
}
