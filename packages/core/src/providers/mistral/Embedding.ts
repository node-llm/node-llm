import { EmbeddingRequest, EmbeddingResponse } from "../Provider.js";
import { logger } from "../../utils/logger.js";
import { handleMistralError } from "./Errors.js";
import { MistralCapabilities } from "./Capabilities.js";

interface MistralEmbeddingResponse {
  id: string;
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class MistralEmbedding {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || "mistral-embed";

    if (!MistralCapabilities.supportsEmbeddings(model)) {
      throw new Error(`Model ${model} does not support embeddings`);
    }

    const body = {
      model,
      input: request.input,
      encoding_format: "float"
    };

    const url = `${this.baseUrl}/embeddings`;
    logger.logRequest("Mistral Embeddings", "POST", url, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await handleMistralError(response, model);
    }

    const json = (await response.json()) as MistralEmbeddingResponse;
    logger.logResponse("Mistral Embeddings", response.status, response.statusText, json);

    return {
      model: json.model,
      vectors: json.data.map((item) => item.embedding),
      input_tokens: json.usage?.prompt_tokens ?? 0,
      dimensions: json.data[0]?.embedding?.length ?? 0
    };
  }
}
