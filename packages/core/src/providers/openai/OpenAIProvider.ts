import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { OpenAIChat } from "./Chat.js";
import { OpenAIStreaming } from "./Streaming.js";
import { OpenAIModels } from "./Models.js";
import { OpenAIImage } from "./Image.js";

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class OpenAIProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: OpenAIChat;
  private readonly streamingHandler: OpenAIStreaming;
  private readonly modelsHandler: OpenAIModels;
  private readonly imageHandler: OpenAIImage;

  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsStructuredOutput(model),
    getContextWindow: (model: string) => Capabilities.getContextWindow(model),
  };

  constructor(private readonly options: OpenAIProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
    this.chatHandler = new OpenAIChat(this.baseUrl, options.apiKey);
    this.streamingHandler = new OpenAIStreaming(this.baseUrl, options.apiKey);
    this.modelsHandler = new OpenAIModels(this.baseUrl, options.apiKey);
    this.imageHandler = new OpenAIImage(this.baseUrl, options.apiKey);
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
}
