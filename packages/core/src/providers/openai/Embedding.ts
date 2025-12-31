import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";
import { handleOpenAIError } from "./Errors.js";
import { Capabilities } from "./Capabilities.js";
import { DEFAULT_MODELS } from "../../constants.js";

export class OpenAIEmbedding {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || DEFAULT_MODELS.EMBEDDING;

    // Validate that the model is an embedding model
    if (Capabilities.getModelType(model) !== "embedding") {
      throw new Error(`Model ${model} does not support embeddings.`);
    }

    const body: any = {
      input: request.input,
      model,
    };

    if (request.dimensions) {
      body.dimensions = request.dimensions;
    }

    if (request.user) {
      body.user = request.user;
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model || DEFAULT_MODELS.EMBEDDING);
    }

    const json = await response.json();

    // Extract vectors from the response
    const vectors = json.data.map((item: any) => item.embedding);

    return {
      vectors,
      model: json.model,
      input_tokens: json.usage.prompt_tokens,
      dimensions: vectors[0]?.length || 0,
    };
  }
}
