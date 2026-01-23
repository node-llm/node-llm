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
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ProviderCapabilities
} from "../Provider.js";
import { BaseProvider } from "../BaseProvider.js";
import { BedrockConfig, getBedrockEndpoint } from "./config.js";
import { BedrockChat } from "./Chat.js";
import { Capabilities } from "./Capabilities.js";

export class BedrockProvider extends BaseProvider implements Provider {
  private readonly config: BedrockConfig;
  private readonly chatHandler: BedrockChat;

  public capabilities: ProviderCapabilities = {
    supportsVision: (model: string) => Capabilities.supportsVision(model),
    supportsTools: (model: string) => Capabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => Capabilities.supportsJsonMode(model),
    supportsEmbeddings: (_model: string) => false,
    supportsImageGeneration: (_model: string) => false,
    supportsTranscription: (_model: string) => false,
    supportsModeration: (_model: string) => false,
    supportsReasoning: (model: string) => Capabilities.supportsExtendedThinking(model),
    supportsDeveloperRole: (_model: string) => true,
    getContextWindow: (model: string) => Capabilities.getContextWindow(model)
  };

  constructor(config: BedrockConfig) {
    super();
    this.config = config;
    this.chatHandler = new BedrockChat(config);
  }

  public apiBase(): string {
    return getBedrockEndpoint(this.config.region);
  }

  public headers(): Record<string, string> {
    // Headers are built dynamically based on auth mode
    return {
      "Content-Type": "application/json"
    };
  }

  protected providerName(): string {
    return "bedrock";
  }

  public override defaultModel(_feature?: string): string {
    // Claude 3.5 Haiku is a good default - fast and cost-effective
    return "anthropic.claude-3-5-haiku-20241022-v1:0";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.chatHandler.execute(request);
  }

  async *stream(_request: ChatRequest): AsyncGenerator<ChatChunk> {
    // Streaming will be implemented in Feature 3
    this.throwUnsupportedError("stream (coming soon)");
    yield* [];
  }
}

// Re-export config for convenience
export { BedrockConfig } from "./config.js";
