import { Message } from "../chat/Message.js";
import { UnsupportedFeatureError } from "../errors/index.js";
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
  EmbeddingResponse,
  ProviderCapabilities
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

  public defaultModel(_feature?: string): string {
    return "";
  }

  protected throwUnsupportedError(feature: string): never {
    throw new UnsupportedFeatureError(this.providerName(), feature);
  }

  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract capabilities?: ProviderCapabilities;

  async *stream?(_request: ChatRequest): AsyncIterable<ChatChunk> {
    this.throwUnsupportedError("stream");
    yield* [];
  }

  async listModels?(): Promise<ModelInfo[]> {
    this.throwUnsupportedError("listModels");
  }

  async paint?(_request: ImageRequest): Promise<ImageResponse> {
    this.throwUnsupportedError("paint");
  }

  async transcribe?(_request: TranscriptionRequest): Promise<TranscriptionResponse> {
    this.throwUnsupportedError("transcribe");
  }

  async moderate?(_request: ModerationRequest): Promise<ModerationResponse> {
    this.throwUnsupportedError("moderate");
  }

  async embed?(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.throwUnsupportedError("embed");
  }

  formatToolResultMessage(toolCallId: string, content: string, options?: { isError?: boolean }): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content,
      isError: options?.isError
    };
  }
}
