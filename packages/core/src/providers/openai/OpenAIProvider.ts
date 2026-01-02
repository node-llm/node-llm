import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse, ModerationRequest, ModerationResponse } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { OpenAIChat } from "./Chat.js";
import { OpenAIStreaming } from "./Streaming.js";
import { OpenAIModels } from "./Models.js";
import { OpenAIImage } from "./Image.js";
import { OpenAITranscription } from "./Transcription.js";
import { OpenAIModeration } from "./Moderation.js";
import { OpenAIEmbedding } from "./Embedding.js";
import { TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class OpenAIProvider implements Provider {
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
    getContextWindow: (model: string) => Capabilities.getContextWindow(model) || null,
  };

  constructor(protected readonly options: OpenAIProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
    this.chatHandler = new OpenAIChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new OpenAIStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new OpenAIModels(this.baseUrl, options.apiKey);
    this.imageHandler = new OpenAIImage(this.baseUrl, options.apiKey);
    this.transcriptionHandler = new OpenAITranscription(this.baseUrl, options.apiKey);
    this.moderationHandler = new OpenAIModeration(this.baseUrl, options.apiKey);
    this.embeddingHandler = new OpenAIEmbedding(this.baseUrl, options.apiKey);
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
