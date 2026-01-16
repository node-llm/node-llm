import { EmbeddingRequest, EmbeddingResponse } from "../Provider.js";
import { GeminiBatchEmbedRequest, GeminiBatchEmbedResponse, GeminiEmbedRequest } from "./types.js";
import { handleGeminiError } from "./Errors.js";
import { logger } from "../../utils/logger.js";

export class GeminiEmbeddings {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const modelId = request.model || "text-embedding-004";
    const url = `${this.baseUrl}/models/${modelId}:batchEmbedContents?key=${this.apiKey}`;
    const inputs = Array.isArray(request.input) ? request.input : [request.input];

    const payload: GeminiBatchEmbedRequest = {
      requests: inputs.map((text) => {
        const item: GeminiEmbedRequest = {
          model: `models/${modelId}`,
          content: {
            parts: [{ text: String(text) }]
          }
        };
        if (request.dimensions) {
          item.outputDimensionality = request.dimensions;
        }
        return item;
      })
    };

    logger.logRequest("Gemini", "POST", url, payload);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await handleGeminiError(response, modelId);
    }

    const json = (await response.json()) as GeminiBatchEmbedResponse;
    logger.logResponse("Gemini", response.status, response.statusText, json);
    const vectors = json.embeddings?.map((e) => e.values) || [];

    return {
      model: modelId,
      vectors: vectors,
      input_tokens: 0,
      dimensions: vectors[0]?.length || 0
    };
  }
}
