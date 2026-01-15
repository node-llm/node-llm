import { ImageRequest, ImageResponse } from "../Provider.js";
import { handleGeminiError } from "./Errors.js";
import { logger } from "../../utils/logger.js";

export class GeminiImage {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ImageRequest): Promise<ImageResponse> {
    const modelId = request.model || "imagen-4.0-generate-001";
    const url = `${this.baseUrl}/models/${modelId}:predict?key=${this.apiKey}`;

    if (request.size) {
      logger.warn(`[Gemini] Ignoring size ${request.size}. Gemini does not support image size customization.`);
    }

    const body: any = {
      instances: [
        {
          prompt: request.prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    };

    logger.logRequest("Gemini", "POST", url, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleGeminiError(response, modelId);
    }

    const json = await response.json();
    logger.logResponse("Gemini", response.status, response.statusText, json);
    const imageData = json.predictions?.[0];

    if (!imageData || !imageData.bytesBase64Encoded) {
      throw new Error("Unexpected response format from Gemini image generation API");
    }

    const mimeType = imageData.mimeType || "image/png";
    const base64Data = imageData.bytesBase64Encoded;

    return {
      data: base64Data,
      mime_type: mimeType,
    };
  }
}
