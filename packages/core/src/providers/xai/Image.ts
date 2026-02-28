import { ImageRequest, ImageResponse } from "../Provider.js";
import { handleXAIError } from "./Errors.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

interface XAIImageResponse {
  data?: Array<{
    url?: string;
    revised_prompt?: string;
  }>;
}

export class XAIImage {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ImageRequest): Promise<ImageResponse> {
    const body: Record<string, unknown> = {
      model: request.model || "grok-imagine-image",
      prompt: request.prompt
    };

    if (request.size) body.size = request.size;
    if (request.n) body.n = request.n;

    if (request.quality) body.quality = request.quality;

    const url = `${this.baseUrl}/images/generations`;
    logger.logRequest("xAI", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleXAIError(response, request.model);
    }

    const json = (await response.json()) as XAIImageResponse;
    logger.logResponse("xAI", response.status, response.statusText, json);
    const data = json.data?.[0];

    if (!data) {
      throw new Error("xAI returned empty image response");
    }

    return {
      url: data.url,
      revised_prompt: data.revised_prompt,
      mime_type: "image/png"
    };
  }
}
