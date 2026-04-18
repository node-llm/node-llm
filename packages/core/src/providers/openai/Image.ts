import { ImageRequest, ImageResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { BinaryUtils } from "../../utils/Binary.js";

export class OpenAIImage {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ImageRequest): Promise<ImageResponse> {
    const isEdit = !!(request.images && request.images.length > 0);
    const model = request.model || (isEdit ? "gpt-image-1" : "dall-e-3");

    if (isEdit) {
      return this.executeEdit(request, model);
    }

    const body: Record<string, unknown> = {
      model,
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
      await handleOpenAIError(response, model);
    }

    const json = await response.json();
    logger.logResponse("OpenAI", response.status, response.statusText, json);
    const data = json.data?.[0];

    if (!data) {
      logger.debug("OpenAI Response missing data array:", json);
      throw new Error("OpenAI returned empty image response");
    }

    return {
      url: data.url,
      data: data.b64_json,
      revised_prompt: data.revised_prompt,
      mime_type: "image/png"
    };
  }

  private async executeEdit(request: ImageRequest, model: string): Promise<ImageResponse> {
    const formData = new FormData();
    formData.append("model", model);
    formData.append("prompt", request.prompt);

    if (request.size) formData.append("size", request.size);
    if (request.n) formData.append("n", String(request.n));

    if (request.images && request.images[0]) {
      const imageFile = request.images[0]!;

      // Download/Read the image
      const imageBinary = await BinaryUtils.toBase64(imageFile);
      if (imageBinary) {
        const imageBlob = BinaryUtils.base64ToBlob(imageBinary);
        formData.append("image", imageBlob, "image.png");
      }

      if (request.mask) {
        const maskBinary = await BinaryUtils.toBase64(request.mask);
        if (maskBinary) {
          const maskBlob = BinaryUtils.base64ToBlob(maskBinary);
          formData.append("mask", maskBlob, "mask.png");
        }
      }
    }

    const endpoint = request.prompt ? "/images/edits" : "/images/variations";
    const url = buildUrl(this.baseUrl, endpoint);

    logger.logRequest("OpenAI", "POST", url, { model, prompt: request.prompt });

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        body: formData
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleOpenAIError(response, model);
    }

    const json = await response.json();
    logger.logResponse("OpenAI", response.status, response.statusText, json);
    const data = json.data?.[0];

    if (!data) {
      logger.debug("OpenAI Response missing data array:", json);
      throw new Error("OpenAI returned empty image response");
    }

    return {
      url: data.url,
      data: data.b64_json,
      revised_prompt: data.revised_prompt,
      mime_type: "image/png"
    };
  }
}
