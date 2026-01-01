import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse, ModerationRequest, ModerationResponse, TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";
import { Capabilities, ANTHROPIC_MODELS } from "./Capabilities.js";
import { AnthropicChat } from "./Chat.js";
import { AnthropicStreaming } from "./Streaming.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class AnthropicProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: AnthropicChat;
  private readonly streamHandler: AnthropicStreaming;

  // Capabilities Interface Implementation
  public capabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsJsonMode(model), // Mapping JsonMode to StructuredOutput approximation
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
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatHandler.execute(request);
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    yield* this.streamHandler.execute(request);
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "x-api-key": this.options.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        // Fallback to static list if API fails
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.data || [];

      return models.map((model: any) => {
        const id = model.id;
        const createdAt = new Date(model.created_at);

        return {
          id: id,
          name: model.display_name || id,
          provider: "anthropic",
          family: Capabilities.getFamily(id),
          context_window: Capabilities.getContextWindow(id),
          max_output_tokens: Capabilities.getMaxOutputTokens(id),
          modalities: Capabilities.getModalities(id),
          capabilities: Capabilities.getCapabilities(id),
          pricing: Capabilities.getPricing(id),
          created_at: createdAt
        };
      });
    } catch (error) {
       // Fallback to currently defined static models if API list fails (or not supported/authorized)
       return Object.entries(ANTHROPIC_MODELS).filter(([key]) => key !== "other").map(([key, def]) => {
        let id = key.replace(/_/g, "-");
        // Simple heuristic mapping for static fallback
        if (id.includes("claude-3-5")) id = "claude-3-5-sonnet-20240620";
        else if (id.includes("claude-3-haiku")) id = "claude-3-haiku-20240307";

        return {
          id: id,
          name: id,
          provider: "anthropic",
          family: Capabilities.getFamily(id),
          context_window: def.contextWindow,
          max_output_tokens: def.maxOutputTokens,
          modalities: Capabilities.getModalities(id),
          capabilities: Capabilities.getCapabilities(id),
          pricing: Capabilities.getPricing(id)
        };
      });
    }
  }

  // Unsupported methods
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
