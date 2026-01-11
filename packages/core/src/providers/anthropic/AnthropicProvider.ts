import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse, ModerationRequest, ModerationResponse, TranscriptionRequest, TranscriptionResponse, EmbeddingRequest, EmbeddingResponse } from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { Capabilities } from "./Capabilities.js";
import { AnthropicChat } from "./Chat.js";
import { AnthropicStreaming } from "./Streaming.js";
import { AnthropicModels } from "./Models.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class AnthropicProvider extends BaseProvider implements Provider {
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
    supportsReasoning: (_model: string) => false,
    supportsDeveloperRole: (_model: string) => true,
    getContextWindow: (model: string) => Capabilities.getContextWindow(model),
  };

  constructor(private readonly options: AnthropicProviderOptions) {
    super();
    this.baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1";
    this.chatHandler = new AnthropicChat(this.baseUrl, options.apiKey);
    this.streamHandler = new AnthropicStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new AnthropicModels(this.baseUrl, options.apiKey);
  }

  public apiBase(): string {
    return this.baseUrl;
  }

  public headers(): Record<string, string> {
    return {
      "x-api-key": this.options.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }

  protected providerName(): string {
    return "Anthropic";
  }

  public override defaultModel(feature?: string): string {
    return "claude-3-5-haiku-20241022";
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

  // Unsupported features will use BaseProvider's default implementations
}

