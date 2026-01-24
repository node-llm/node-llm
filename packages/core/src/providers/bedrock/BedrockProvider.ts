/**
 * AWS Bedrock Provider
 *
 * Unified provider for all Bedrock-hosted models using the Converse API.
 * Supports: Claude, DeepSeek, Titan, Mistral, Llama, and other Bedrock models.
 *
 * @example
 * ```ts
 * // Using API Key (recommended)
 * const bedrock = new BedrockProvider({
 *   region: "us-east-1",
 *   apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK
 * });
 *
 * // Using SigV4 (IAM credentials)
 * const bedrock = new BedrockProvider({
 *   region: "us-east-1",
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
 * });
 *
 * const response = await bedrock.chat({
 *   model: "anthropic.claude-3-5-haiku-20241022-v1:0",
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */

import {
  Provider,
  ProviderCapabilities,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  ImageRequest,
  ImageResponse,
  ModerationRequest,
  ModerationResponse
} from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { BedrockConfig, getBedrockEndpoint } from "./config.js";
import { BedrockChat } from "./Chat.js";
import { BedrockModels } from "./Models.js";
import { BedrockStreaming } from "./Streaming.js";
import { BedrockEmbeddings } from "./Embeddings.js";
import { BedrockImage } from "./Image.js";
import { BedrockModeration } from "./Moderation.js";
import { Capabilities } from "./Capabilities.js";

export class BedrockProvider extends BaseProvider implements Provider {
  private readonly config: BedrockConfig;
  private readonly chatHandler: BedrockChat;
  private readonly modelsHandler: BedrockModels;
  private readonly streamingHandler: BedrockStreaming;
  private readonly embeddingsHandler: BedrockEmbeddings;
  private readonly imageHandler: BedrockImage;
  private readonly moderationHandler: BedrockModeration;

  public capabilities: ProviderCapabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsJsonMode(model),
    supportsEmbeddings: (model: string) => Capabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => Capabilities.supportsImageGeneration(model),
    supportsTranscription: (_model: string) => false,
    supportsModeration: (_model: string) =>
      !!(this.config.guardrailIdentifier && this.config.guardrailVersion),
    supportsReasoning: (model: string) => Capabilities.supportsExtendedThinking(model),
    supportsDeveloperRole: (_model: string) => true,
    getContextWindow: (model: string) => Capabilities.getContextWindow(model)
  };

  constructor(config: BedrockConfig) {
    super();
    this.config = config;
    this.chatHandler = new BedrockChat(config);
    this.modelsHandler = new BedrockModels(config);
    this.streamingHandler = new BedrockStreaming(config);
    this.embeddingsHandler = new BedrockEmbeddings(config);
    this.imageHandler = new BedrockImage(config);
    this.moderationHandler = new BedrockModeration(config);
  }

  public apiBase(): string {
    return getBedrockEndpoint(this.config.region);
  }

  public headers(): Record<string, string> {
    // Headers are built dynamically based on auth mode
    // This method is primarily for SigV4 signing, which happens at the HTTP client level.
    // For API Key auth, the key is passed in the Authorization header directly.
    // For now, we return a default Content-Type.
    return {
      "Content-Type": "application/json"
    };
  }

  protected providerName(): string {
    return "bedrock";
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

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.embeddingsHandler.execute(request);
  }

  async paint(request: ImageRequest): Promise<ImageResponse> {
    return this.imageHandler.execute(request);
  }

  async moderate(request: ModerationRequest): Promise<ModerationResponse> {
    return this.moderationHandler.execute(request);
  }

  public override defaultModel(feature?: string): string {
    if (feature === "embeddings") {
      return "amazon.titan-embed-text-v2:0";
    }
    // Amazon Nova Lite is available by default and cost-effective
    return "amazon.nova-lite-v1:0";
  }
}

// Re-export config for convenience
export { BedrockConfig } from "./config.js";
