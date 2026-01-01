import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse, ModerationRequest, ModerationResponse, TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";
import { Capabilities } from "./Capabilities.js";
import { AnthropicChat } from "./Chat.js";
import { AnthropicStreaming } from "./Streaming.js";
import { AnthropicModels } from "./Models.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class AnthropicProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: AnthropicChat;
  private readonly streamHandler: AnthropicStreaming;
  private readonly modelsHandler: AnthropicModels;

  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsJsonMode(model),
    supportsEmbeddings: (_model: string) => false,
    supportsImageGeneration: (_model: string) => false,
    supportsTranscription: (_model: string) => false,
    supportsModeration: (_model: string) => false,
    getContextWindow: (model: string) => Capabilities.getContextWindow(model),
  };

  constructor(private readonly options: AnthropicProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1";
    this.chatHandler = new AnthropicChat(this.baseUrl, options.apiKey);
    this.streamHandler = new AnthropicStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new AnthropicModels(this.baseUrl, options.apiKey);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatHandler.execute(request);
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    yield* this.streamHandler.execute(request);
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.modelsHandler.execute();
  }

  async paint(_request: ImageRequest): Promise<ImageResponse> {
    throw new Error("Anthropic doesn't support image generation");
  }

  async transcribe(_request: TranscriptionRequest): Promise<TranscriptionResponse> {
    throw new Error("Anthropic doesn't support transcription");
  }

  async moderate(_request: ModerationRequest): Promise<ModerationResponse> {
    throw new Error("Anthropic doesn't support moderation");
  }

  async embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error("Anthropic doesn't support embeddings");
  }
}

