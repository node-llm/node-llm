/**
 * Bedrock Image Generation Handler
 *
 * Supports Amazon Titan Image Generator and Stability.ai Stable Diffusion models.
 */

import { ImageRequest, ImageResponse } from "../Provider.js";
import { BedrockConfig, getBedrockEndpoint } from "./config.js";
import { signRequest, AwsCredentials } from "../../utils/AwsSigV4.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";

export class BedrockImage {
  private readonly config: BedrockConfig;
  private readonly baseUrl: string;

  constructor(config: BedrockConfig) {
    this.config = config;
    this.baseUrl = getBedrockEndpoint(config.region);
  }

  /**
   * Execute an image generation request.
   */
  async execute(request: ImageRequest): Promise<ImageResponse> {
    const modelId = request.model ?? "amazon.titan-image-generator-v2:0";
    const url = `${this.baseUrl}/model/${modelId}/invoke`;

    const body = this.buildRequestBody(modelId, request);
    const bodyJson = JSON.stringify(body);
    const headers = this.buildHeaders(url, bodyJson, request.headers);

    logger.logRequest("BedrockImage", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body: bodyJson
      },
      request.requestTimeout ?? this.config.requestTimeout ?? 120000
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.logResponse("BedrockImage", response.status, response.statusText, errorText);
      throw new Error(`Bedrock Image Generation error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this.parseResponse(modelId, data);
  }

  /**
   * Build model-specific request body.
   */
  private buildRequestBody(modelId: string, request: ImageRequest): any {
    const prompt = request.prompt;

    // Amazon Titan
    if (modelId.includes("amazon.titan-image")) {
      return {
        taskType: "TEXT_IMAGE",
        textToImageParams: {
          text: prompt
        },
        imageGenerationConfig: {
          numberOfImages: request.n ?? 1,
          height: this.parseSize(request.size)?.height ?? 1024,
          width: this.parseSize(request.size)?.width ?? 1024,
          cfgScale: 8.0
        }
      };
    }

    // Stability AI (Stable Diffusion)
    if (modelId.includes("stability.stable-diffusion")) {
      return {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        steps: 30,
        samples: request.n ?? 1,
        width: this.parseSize(request.size)?.width ?? 1024,
        height: this.parseSize(request.size)?.height ?? 1024
      };
    }

    throw new Error(`Unsupported image generation model: ${modelId}`);
  }

  /**
   * Parse model-specific response.
   */
  private parseResponse(modelId: string, data: any): ImageResponse {
    // Amazon Titan returns { images: ["base64", ...] }
    if (modelId.includes("amazon.titan-image")) {
      const base64 = data.images?.[0];
      if (!base64) throw new Error("No image data returned from Titan");
      return {
        data: base64,
        mime_type: "image/png"
      };
    }

    // Stability AI returns { artifacts: [ { base64: "...", ... } ] }
    if (modelId.includes("stability.stable-diffusion")) {
      const base64 = data.artifacts?.[0]?.base64;
      if (!base64) throw new Error("No image data returned from Stable Diffusion");
      return {
        data: base64,
        mime_type: "image/png"
      };
    }

    throw new Error(`Unsupported model response format: ${modelId}`);
  }

  /**
   * Parse size string (e.g. "1024x1024") into height and width.
   */
  private parseSize(size?: string): { width: number; height: number } | null {
    if (!size) return null;
    const parts = size.toLowerCase().split("x");
    const width = parts[0];
    const height = parts[1];

    if (width && height) {
      return {
        width: parseInt(width, 10),
        height: parseInt(height, 10)
      };
    }
    return null;
  }

  /**
   * Build headers with SigV4 signing.
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

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else if (this.config.accessKeyId && this.config.secretAccessKey && this.config.region) {
      const accessKeyId = this.config.accessKeyId;
      const secretAccessKey = this.config.secretAccessKey;
      const region = this.config.region;

      const credentials: AwsCredentials = {
        accessKeyId,
        secretAccessKey,
        sessionToken: this.config.sessionToken
      };

      const signedHeaders = signRequest({
        method: "POST",
        url,
        body,
        credentials,
        region,
        service: "bedrock"
      });

      return { ...headers, ...signedHeaders };
    }

    return headers;
  }
}
