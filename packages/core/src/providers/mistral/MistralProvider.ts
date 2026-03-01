import {
  Provider,
  ChatRequest,
  ChatResponse,
  ModelInfo,
  ChatChunk,
  EmbeddingRequest,
  EmbeddingResponse
} from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { DEFAULT_MISTRAL_BASE_URL } from "../../constants.js";
import { MistralChat } from "./Chat.js";
import { MistralModels } from "./Models.js";
import { MistralStreaming } from "./Streaming.js";
import { MistralEmbedding } from "./Embedding.js";
import { MistralCapabilities } from "./Capabilities.js";

export interface MistralProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class MistralProvider extends BaseProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: MistralChat;
  private readonly streamingHandler: MistralStreaming;
  private readonly modelsHandler: MistralModels;
  private readonly embeddingHandler: MistralEmbedding;

  public capabilities = {
    supportsVision: (model: string) => MistralCapabilities.supportsVision(model),
    supportsTools: (model: string) => MistralCapabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) =>
      MistralCapabilities.supportsStructuredOutput(model),
    supportsEmbeddings: (model: string) => MistralCapabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => MistralCapabilities.supportsImageGeneration(model),
    supportsTranscription: (model: string) => MistralCapabilities.supportsTranscription(model),
    supportsModeration: (model: string) => MistralCapabilities.supportsModeration(model),
    supportsReasoning: (model: string) => MistralCapabilities.supportsReasoning(model),
    supportsDeveloperRole: (_model: string) => false,
    getContextWindow: (model: string) => MistralCapabilities.getContextWindow(model)
  };

  constructor(private readonly options: MistralProviderOptions) {
    super();
    this.baseUrl = options.baseUrl ?? DEFAULT_MISTRAL_BASE_URL;
    this.chatHandler = new MistralChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new MistralStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new MistralModels(this.baseUrl, options.apiKey);
    this.embeddingHandler = new MistralEmbedding(this.baseUrl, options.apiKey);
  }

  public apiBase(): string {
    return this.baseUrl;
  }

  public headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }

  protected providerName(): string {
    return "Mistral";
  }

  public override defaultModel(feature?: string): string {
    if (feature === "embedding" || feature === "embeddings") return "mistral-embed";
    return "mistral-large-latest";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatHandler.execute(request);
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    yield* this.streamingHandler.execute(request);
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.modelsHandler.execute();
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.embeddingHandler.execute(request);
  }
}
