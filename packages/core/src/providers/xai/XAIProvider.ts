import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk } from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { DEFAULT_XAI_BASE_URL } from "../../constants.js";
import { XAIChat } from "./Chat.js";
import { XAIModels } from "./Models.js";
import { XAIStreaming } from "./Streaming.js";
import { Capabilities } from "./Capabilities.js";

export interface XAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class XAIProvider extends BaseProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: XAIChat;
  private readonly streamingHandler: XAIStreaming;
  private readonly modelsHandler: XAIModels;

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

  constructor(private readonly options: XAIProviderOptions) {
    super();
    this.baseUrl = options.baseUrl ?? DEFAULT_XAI_BASE_URL;
    this.chatHandler = new XAIChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new XAIStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new XAIModels(this.baseUrl, options.apiKey);
  }

  public get id(): string {
    return "xai";
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
    return "xAI";
  }

  public override defaultModel(_feature?: string): string {
    return "grok-2";
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
}
