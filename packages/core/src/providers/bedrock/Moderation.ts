/**
 * Bedrock Moderation Handler
 *
 * Implements the standalone moderation endpoint using Bedrock Guardrails.
 * Use this to check content for safety before sending it to an LLM.
 */

import { ModerationRequest, ModerationResponse, ModerationResult } from "../Provider.js";
import { BedrockConfig, validateBedrockConfig, getBedrockEndpoint } from "./config.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";

export class BedrockModeration {
  private readonly config: BedrockConfig;
  private readonly authMode: "apiKey" | "sigv4";
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.authMode = validateBedrockConfig(config);
    this.baseUrl = getBedrockEndpoint(config.region);
  }

  /**
   * Execute a moderation request against Bedrock Guardrails.
   */
  async execute(request: ModerationRequest): Promise<ModerationResponse> {
    const { guardrailIdentifier, guardrailVersion } = this.config;

    if (!guardrailIdentifier || !guardrailVersion) {
      throw new Error(
        "Bedrock moderation requires 'bedrockGuardrailIdentifier' and 'bedrockGuardrailVersion' to be configured."
      );
    }

    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const results: ModerationResult[] = [];

    // Process each input against the guardrail
    // Note: Bedrock ApplyGuardrail accepts a list of content blocks,
    // but usually we want to moderate individual strings to get back granular results.
    for (const text of inputs) {
      const result = await this.applyGuardrail(
        text,
        guardrailIdentifier,
        guardrailVersion,
        request.requestTimeout
      );
      results.push(result);
    }

    return {
      id: `bedrock-mod-${Date.now()}`,
      model: `guardrail:${guardrailIdentifier}:${guardrailVersion}`,
      results
    };
  }

  private async applyGuardrail(
    text: string,
    id: string,
    version: string,
    timeout?: number
  ): Promise<ModerationResult> {
    const encodedId = encodeURIComponent(id);
    const encodedVersion = encodeURIComponent(version);
    const url = `${this.baseUrl}/guardrail/${encodedId}/version/${encodedVersion}/apply`;
    const body = JSON.stringify({
      content: [{ text: { text } }],
      source: "INPUT"
    });

    const headers = this.buildHeaders(url, body);

    logger.logRequest("Bedrock Moderation", "POST", url, { text });

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body
      },
      timeout ?? this.config.requestTimeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bedrock Moderation API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    logger.logResponse("Bedrock Moderation", response.status, response.statusText, json);

    return this.mapToModerationResult(json);
  }

  private mapToModerationResult(response: any): ModerationResult {
    const flagged = response.action === "BLOCK";
    const categories: Record<string, boolean> = {};
    const category_scores: Record<string, number> = {};

    // Map Bedrock assessments to standard categories
    if (response.assessments) {
      for (const assessment of response.assessments) {
        // Content Policy Filters (Hate, Violence, etc.)
        if (assessment.contentPolicy?.filters) {
          for (const filter of assessment.contentPolicy.filters) {
            const key = filter.type.toLowerCase();
            const isBlocked = filter.action === "BLOCK";
            categories[key] = isBlocked;
            // Map confidence to a 0-1 score
            category_scores[key] = this.mapConfidence(filter.confidence);
          }
        }

        // Topic Policy
        if (assessment.topicPolicy?.topics) {
          for (const topic of assessment.topicPolicy.topics) {
            categories[`topic_${topic.name.toLowerCase()}`] = topic.action === "BLOCK";
            category_scores[`topic_${topic.name.toLowerCase()}`] = 1.0;
          }
        }
      }
    }

    return {
      flagged,
      categories,
      category_scores
    };
  }

  private mapConfidence(confidence: string): number {
    switch (confidence) {
      case "HIGH":
        return 0.9;
      case "MEDIUM":
        return 0.5;
      case "LOW":
        return 0.1;
      case "NONE":
        return 0.0;
      default:
        return 0.0;
    }
  }

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
        body,
        credentials,
        region: this.config.region,
        service: "bedrock"
      });

      Object.assign(headers, signedHeaders);
    }

    return headers;
  }
}
