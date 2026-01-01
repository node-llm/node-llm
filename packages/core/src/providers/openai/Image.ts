import { ImageRequest, ImageResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";

export class OpenAIImage {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ImageRequest): Promise<ImageResponse> {
    const body: any = {
      model: request.model || "dall-e-3",
      prompt: request.prompt,
      size: request.size || "1024x1024",
      quality: request.quality || "standard",
      n: request.n || 1,
    };

    const response = await fetch(buildUrl(this.baseUrl, '/images/generations'), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model);
    }

    const json = await response.json();
    const data = json.data?.[0];

    if (!data) {
      throw new Error("OpenAI returned empty image response");
    }

    return {
      url: data.url,
      revised_prompt: data.revised_prompt,
      mime_type: "image/png",
    };
  }
}
