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
  ModerationResponse 
} from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { GeminiChat } from "./Chat.js";
import { GeminiStreaming } from "./Streaming.js";
import { GeminiModels } from "./Models.js";
import { GeminiImage } from "./Image.js";
import { GeminiEmbeddings } from "./Embeddings.js";
import { GeminiTranscription } from "./Transcription.js";
import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";

export interface GeminiProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class GeminiProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: GeminiChat;
  private readonly streamingHandler: GeminiStreaming;
  private readonly modelsHandler: GeminiModels;
  private readonly imageHandler: GeminiImage;
  private readonly embeddingHandler: GeminiEmbeddings;
  private readonly transcriptionHandler: GeminiTranscription;

  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsStructuredOutput(model),
    supportsEmbeddings: (model: string) => Capabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => Capabilities.supportsImageGeneration(model),
    supportsTranscription: (model: string) => Capabilities.supportsTranscription(model),
    supportsModeration: (model: string) => Capabilities.supportsModeration(model),
    getContextWindow: (model: string) => Capabilities.getContextWindow(model),
  };

  constructor(private readonly options: GeminiProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    this.chatHandler = new GeminiChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new GeminiStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new GeminiModels(this.baseUrl, options.apiKey);
    this.imageHandler = new GeminiImage(this.baseUrl, options.apiKey);
    this.embeddingHandler = new GeminiEmbeddings(this.baseUrl, options.apiKey);
    this.transcriptionHandler = new GeminiTranscription(this.baseUrl, options.apiKey);
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

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.embeddingHandler.execute(request);
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    return this.transcriptionHandler.execute(request);
  }

  async moderate(_request: ModerationRequest): Promise<ModerationResponse> {
    throw new Error("Gemini doesn't support moderation");
  }
}
