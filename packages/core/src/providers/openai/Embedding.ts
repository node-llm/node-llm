import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";
import { handleOpenAIError } from "./Errors.js";
import { Capabilities } from "./Capabilities.js";
import { DEFAULT_MODELS } from "../../constants.js";
import { buildUrl } from "./utils.js";

export class OpenAIEmbedding {
  constructor(
    protected readonly baseUrl: string,
    protected readonly apiKey: string
  ) {}

  protected getProviderName(): string {
    return "openai";
  }

  protected validateModel(model: string): void {
    if (Capabilities.getModelType(model) !== "embeddings") {
      throw new Error(`Model ${model} does not support embeddings.`);
    }
  }

  async execute(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || DEFAULT_MODELS.EMBEDDING;

    this.validateModel(model);

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

    const response = await fetch(buildUrl(this.baseUrl, '/embeddings'), {
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

    const { data, model: responseModel, usage } = await response.json();

    // Extract vectors from the response
    const vectors = data.map((item: any) => item.embedding);

    return {
      vectors,
      model: responseModel,
      input_tokens: usage.prompt_tokens,
      dimensions: vectors[0]?.length || 0,
    };
  }
}
