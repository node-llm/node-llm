import {
  Provider,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ModelInfo,
  ImageRequest,
  ImageResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  ModerationRequest,
  ModerationResponse,
  EmbeddingRequest,
  EmbeddingResponse
} from "./Provider.js";

/**
 * Abstract base class for all LLM providers.
 * Provides common functionality and default implementations for unsupported features.
 * Each provider must implement the abstract methods and can override default implementations.
 */
export abstract class BaseProvider implements Provider {
  public abstract apiBase(): string;
  public abstract headers(): Record<string, string>;
  protected abstract providerName(): string;

  get id(): string {
    return this.providerName();
  }

  public defaultModel(feature?: string): string {
    return "";
  }

  protected throwUnsupportedError(feature: string): never {
    throw new Error(`${this.providerName()} does not support ${feature}`);
  }

  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract capabilities?: any;

  async *stream?(request: ChatRequest): AsyncIterable<ChatChunk> {
    this.throwUnsupportedError("stream");
  }

  async listModels?(): Promise<ModelInfo[]> {
    this.throwUnsupportedError("listModels");
  }

  async paint?(request: ImageRequest): Promise<ImageResponse> {
    this.throwUnsupportedError("paint");
  }

  async transcribe?(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    this.throwUnsupportedError("transcribe");
  }

  async moderate?(request: ModerationRequest): Promise<ModerationResponse> {
    this.throwUnsupportedError("moderate");
  }

  async embed?(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.throwUnsupportedError("embed");
  }
}
