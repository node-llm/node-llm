import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk } from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { DeepSeekChat } from "./Chat.js";
import { DeepSeekModels } from "./Models.js";
import { DeepSeekStreaming } from "./Streaming.js";
import { Capabilities } from "./Capabilities.js";

export interface DeepSeekProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class DeepSeekProvider extends BaseProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: DeepSeekChat;
  private readonly streamingHandler: DeepSeekStreaming;
  private readonly modelsHandler: DeepSeekModels;

  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsStructuredOutput(model),
    supportsEmbeddings: (model: string) => Capabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => Capabilities.supportsImageGeneration(model),
    supportsTranscription: (model: string) => Capabilities.supportsTranscription(model),
    supportsModeration: (model: string) => Capabilities.supportsModeration(model),
    supportsReasoning: (model: string) => Capabilities.supportsReasoning(model),
    supportsDeveloperRole: (_model: string) => false,
    getContextWindow: (model: string) => Capabilities.getContextWindow(model)
  };

  constructor(private readonly options: DeepSeekProviderOptions) {
    super();
    this.baseUrl = options.baseUrl ?? "https://api.deepseek.com";
    this.chatHandler = new DeepSeekChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new DeepSeekStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new DeepSeekModels(this.baseUrl, options.apiKey);
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
    return "DeepSeek";
  }

  public override defaultModel(_feature?: string): string {
    return "deepseek-chat";
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

  // Other features (paint, transcribe, moderate, embed) will use BaseProvider's default implementations
}
