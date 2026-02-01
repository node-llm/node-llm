import {
  Provider,
  ChatRequest,
  ChatResponse,
  ModelInfo,
  ChatChunk,
  ImageRequest,
  ImageResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  ModerationRequest,
  ModerationResponse,
  EmbeddingRequest,
  EmbeddingResponse
} from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { DEFAULT_OPENAI_BASE_URL } from "../../constants.js";
import { Capabilities } from "./Capabilities.js";
import { OpenAIChat } from "./Chat.js";
import { OpenAIStreaming } from "./Streaming.js";
import { OpenAIModels } from "./Models.js";
import { OpenAIImage } from "./Image.js";
import { OpenAITranscription } from "./Transcription.js";
import { OpenAIModeration } from "./Moderation.js";
import { OpenAIEmbedding } from "./Embedding.js";

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class OpenAIProvider extends BaseProvider implements Provider {
  protected baseUrl: string;
  protected chatHandler: OpenAIChat;
  protected streamingHandler: OpenAIStreaming;
  protected modelsHandler: OpenAIModels;
  protected imageHandler: OpenAIImage;
  protected transcriptionHandler: OpenAITranscription;
  protected moderationHandler: OpenAIModeration;
  protected embeddingHandler: OpenAIEmbedding;

  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsStructuredOutput(model),
    supportsEmbeddings: (model: string) => Capabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => Capabilities.supportsImageGeneration(model),
    supportsTranscription: (model: string) => Capabilities.supportsTranscription(model),
    supportsModeration: (model: string) => Capabilities.supportsModeration(model),
    supportsReasoning: (model: string) => Capabilities.supportsReasoning(model),
    supportsDeveloperRole: (modelId: string) =>
      this.baseUrl.includes("api.openai.com") && Capabilities.supportsDeveloperRole(modelId),
    getContextWindow: (model: string) => Capabilities.getContextWindow(model) || null
  };

  constructor(protected readonly options: OpenAIProviderOptions) {
    super();
    this.baseUrl = options.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
    this.chatHandler = new OpenAIChat(this, options.apiKey);
    this.streamingHandler = new OpenAIStreaming(this, options.apiKey);
    this.modelsHandler = new OpenAIModels(this.baseUrl, options.apiKey);
    this.imageHandler = new OpenAIImage(this.baseUrl, options.apiKey);
    this.transcriptionHandler = new OpenAITranscription(this.baseUrl, options.apiKey);
    this.moderationHandler = new OpenAIModeration(this.baseUrl, options.apiKey);
    this.embeddingHandler = new OpenAIEmbedding(this.baseUrl, options.apiKey);
  }

  public apiBase(): string {
    return this.baseUrl;
  }

  public headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  protected providerName(): string {
    return "OpenAI";
  }

  public override defaultModel(feature?: string): string {
    switch (feature) {
      case "embedding":
        return "text-embedding-3-small";
      case "transcription":
        return "whisper-1";
      case "moderation":
        return "omni-moderation-latest";
      case "image":
        return "dall-e-3";
      default:
        return "gpt-4o";
    }
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

  async paint(request: ImageRequest): Promise<ImageResponse> {
    return this.imageHandler.execute(request);
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    return this.transcriptionHandler.execute(request);
  }

  async moderate(request: ModerationRequest): Promise<ModerationResponse> {
    return this.moderationHandler.execute(request);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.embeddingHandler.execute(request);
  }
}
