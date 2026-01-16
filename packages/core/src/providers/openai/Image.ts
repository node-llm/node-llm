import { ImageRequest, ImageResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

export class OpenAIImage {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ImageRequest): Promise<ImageResponse> {
    const body: Record<string, unknown> = {
      model: request.model || "dall-e-3",
      prompt: request.prompt,
      size: request.size || "1024x1024",
      quality: request.quality || "standard",
      n: request.n || 1
    };

    const url = buildUrl(this.baseUrl, "/images/generations");
    logger.logRequest("OpenAI", "POST", url, body);

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
      await handleOpenAIError(response, request.model);
    }

    const json = await response.json();
    logger.logResponse("OpenAI", response.status, response.statusText, json);
    const data = json.data?.[0];

    if (!data) {
      throw new Error("OpenAI returned empty image response");
    }

    return {
      url: data.url,
      revised_prompt: data.revised_prompt,
      mime_type: "image/png"
    };
  }
}
