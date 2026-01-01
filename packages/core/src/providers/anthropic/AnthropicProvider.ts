import { Provider, ChatRequest, ChatResponse, ModelInfo, ChatChunk, ImageRequest, ImageResponse, ModerationRequest, ModerationResponse, TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { EmbeddingRequest, EmbeddingResponse } from "../Embedding.js";
import { Capabilities, ANTHROPIC_MODELS } from "./Capabilities.js";
import { AnthropicChat } from "./Chat.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class AnthropicProvider implements Provider {
  private readonly baseUrl: string;
  private readonly chatHandler: AnthropicChat;

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
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatHandler.execute(request);
  }

  // Not implemented yet
  async *stream(_request: ChatRequest): AsyncGenerator<ChatChunk> {
    throw new Error("Streaming not yet implemented for Anthropic");
  }

  async listModels(): Promise<ModelInfo[]> {
    return Object.entries(ANTHROPIC_MODELS).filter(([key]) => key !== "other").map(([key, def]) => {
      // Create a representative model ID from the pattern if possible, or use the key name
      // This is a bit tricky since pattern is regex. 
      // We will map known keys to standard IDs.
      let id = key.replace(/_/g, "-");
      if (key === 'claude3_7_sonnet') id = 'claude-3-7-sonnet-latest'; // Example mapping

      return {
        id: id,
        name: id, // TODO: Humanize
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

  // Unsupported methods
  async paint(_request: ImageRequest): Promise<ImageResponse> {
    throw new Error("Image generation not supported by Anthropic");
  }

  async transcribe(_request: TranscriptionRequest): Promise<TranscriptionResponse> {
    throw new Error("Transcription not supported by Anthropic");
  }

  async moderate(_request: ModerationRequest): Promise<ModerationResponse> {
    throw new Error("Moderation not supported by Anthropic");
  }

  async embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error("Embeddings not supported by Anthropic");
  }
}
