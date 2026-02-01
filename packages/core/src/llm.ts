import { Chat } from "./chat/Chat.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import { Provider, ModelInfo } from "./providers/Provider.js";
import {
  providerRegistry,
  ensureOpenAIRegistered,
  registerAnthropicProvider,
  registerGeminiProvider,
  registerDeepSeekProvider,
  registerOllamaProvider,
  registerOpenRouterProvider,
  registerBedrockProvider
} from "./providers/registry.js";
import { GeneratedImage } from "./image/GeneratedImage.js";
import { ModelRegistry } from "./models/ModelRegistry.js";
import { PricingRegistry } from "./models/PricingRegistry.js";
import { Model } from "./models/types.js";
import { Transcription } from "./transcription/Transcription.js";
import { Moderation } from "./moderation/Moderation.js";
import { Embedding } from "./embedding/Embedding.js";
import { EmbeddingRequest } from "./providers/Provider.js";
import {
  ProviderNotConfiguredError,
  UnsupportedFeatureError,
  ModelCapabilityError
} from "./errors/index.js";
import { resolveModelAlias } from "./model_aliases.js";
import { logger } from "./utils/logger.js";

import { config, NodeLLMConfig, Configuration } from "./config.js";
import { Middleware, MiddlewareContext } from "./types/Middleware.js";
import { runMiddleware } from "./utils/middleware-runner.js";
import { randomUUID } from "node:crypto";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig = {
  provider?: Provider | string;
  retry?: RetryOptions;
  middlewares?: Middleware[];
  defaultChatModel?: string;
  defaultTranscriptionModel?: string;
  defaultModerationModel?: string;
  defaultEmbeddingModel?: string;
} & Omit<Partial<NodeLLMConfig>, "provider">;

// Provider registration map
const PROVIDER_REGISTRARS: Record<string, () => void> = {
  openai: ensureOpenAIRegistered,
  gemini: registerGeminiProvider,
  anthropic: registerAnthropicProvider,
  deepseek: registerDeepSeekProvider,
  ollama: registerOllamaProvider,
  openrouter: registerOpenRouterProvider,
  bedrock: registerBedrockProvider
};

export class NodeLLMCore {
  public readonly models = ModelRegistry;
  public readonly pricing = PricingRegistry;

  constructor(
    public readonly config: NodeLLMConfig,
    public readonly provider?: Provider,
    public readonly retry: Required<RetryOptions> = { attempts: 1, delayMs: 0 },
    public readonly middlewares: Middleware[] = [],
    private readonly defaults: {
      chat?: string;
      transcription?: string;
      moderation?: string;
      embedding?: string;
    } = {}
  ) {
    Object.freeze(this.config);
    Object.freeze(this.retry);
    Object.freeze(this.defaults);
  }

  get defaultChatModel(): string | undefined {
    return this.defaults.chat;
  }
  get defaultTranscriptionModel(): string | undefined {
    return this.defaults.transcription;
  }
  get defaultModerationModel(): string | undefined {
    return this.defaults.moderation;
  }
  get defaultEmbeddingModel(): string | undefined {
    return this.defaults.embedding;
  }

  /**
   * Returns a scoped LLM instance configured for a specific provider.
   * This returns a NEW immutable instance.
   */
  withProvider(providerName: string, scopedConfig?: Partial<NodeLLMConfig>): NodeLLMCore {
    const baseConfig =
      this.config instanceof Configuration ? this.config.toPlainObject() : this.config;
    // We leverage createLLM to handle the resolution of the new provider string
    return createLLM({
      ...baseConfig,
      ...scopedConfig,
      provider: providerName,
      // Preserve middlewares and defaults unless overridden
      middlewares: this.middlewares,
      defaultChatModel: this.defaults.chat,
      defaultTranscriptionModel: this.defaults.transcription,
      defaultModerationModel: this.defaults.moderation,
      defaultEmbeddingModel: this.defaults.embedding
    });
  }

  /**
   * Register a custom LLM provider.
   * Note: This modifies the global provider registry.
   */
  registerProvider(name: string, factory: () => Provider): void {
    providerRegistry.register(name, factory);
  }

  getRetryConfig() {
    return this.retry;
  }

  private ensureProviderSupport<K extends keyof Provider>(
    method: K
  ): Provider & Record<K, NonNullable<Provider[K]>> {
    if (!this.provider) {
      throw new ProviderNotConfiguredError();
    }
    if (!this.provider[method]) {
      throw new UnsupportedFeatureError("Provider", String(method));
    }
    return this.provider as Provider & Record<K, NonNullable<Provider[K]>>;
  }

  chat(model?: string, options: ChatOptions = {}): Chat {
    if (!this.provider) {
      throw new ProviderNotConfiguredError();
    }

    const rawModel = model || this.defaults.chat || this.provider.defaultModel("chat");
    const resolvedModel = resolveModelAlias(rawModel, this.provider.id);

    // Merge global middlewares with local ones
    const combinedOptions = {
      ...options,
      middlewares: [...this.middlewares, ...(options.middlewares || [])]
    };

    return new Chat(this.provider, resolvedModel, combinedOptions, this.retry);
  }

  async listModels(): Promise<ModelInfo[]> {
    const provider = this.ensureProviderSupport("listModels");
    const models = await provider.listModels();

    // Dynamically update the model registry with the fetched info
    ModelRegistry.save(models as unknown as Model[]);

    return models;
  }

  async paint(
    prompt: string,
    options?: {
      model?: string;
      size?: string;
      quality?: string;
      assumeModelExists?: boolean;
      requestTimeout?: number;
      middlewares?: Middleware[];
    }
  ): Promise<GeneratedImage> {
    const provider = this.ensureProviderSupport("paint");

    const rawModel = options?.model || provider.defaultModel("image");
    const model = resolveModelAlias(rawModel, provider.id);

    const requestId = randomUUID();
    const state: Record<string, unknown> = {};

    const context: MiddlewareContext = {
      requestId,
      provider: provider.id,
      model,
      input: prompt,
      imageOptions: options,
      state
    };

    const middlewares = [...this.middlewares, ...(options?.middlewares || [])];

    try {
      await runMiddleware(middlewares, "onRequest", context);

      const currentPrompt = (context.input as string) || prompt;

      if (options?.assumeModelExists) {
        logger.warn(`Skipping validation for model ${model}`);
      } else if (
        model &&
        provider.capabilities &&
        !provider.capabilities.supportsImageGeneration(model)
      ) {
        throw new ModelCapabilityError(model, "image generation");
      }

      const response = await provider.paint({
        prompt: currentPrompt,
        ...options,
        model,
        requestTimeout: options?.requestTimeout ?? this.config.requestTimeout
      });

      const imageResult = new GeneratedImage(response);
      await runMiddleware(middlewares, "onResponse", context, imageResult as any);

      return imageResult;
    } catch (error) {
      await runMiddleware(middlewares, "onError", context, error as Error);
      throw error;
    }
  }

  async transcribe(
    file: string,
    options?: {
      model?: string;
      prompt?: string;
      language?: string;
      speakerNames?: string[];
      speakerReferences?: string[];
      assumeModelExists?: boolean;
      requestTimeout?: number;
      middlewares?: Middleware[];
    }
  ): Promise<Transcription> {
    const provider = this.ensureProviderSupport("transcribe");

    const rawModel =
      options?.model || this.defaults.transcription || provider.defaultModel("transcription");
    const model = resolveModelAlias(rawModel, provider.id);

    const requestId = randomUUID();
    const state: Record<string, unknown> = {};

    const context: MiddlewareContext = {
      requestId,
      provider: provider.id,
      model,
      input: file,
      transcriptionOptions: options,
      state
    };

    const middlewares = [...this.middlewares, ...(options?.middlewares || [])];

    try {
      await runMiddleware(middlewares, "onRequest", context);

      const currentFile = (context.input as string) || file;

      if (options?.assumeModelExists) {
        logger.warn(`Skipping validation for model ${model}`);
      } else if (
        model &&
        provider.capabilities &&
        !provider.capabilities.supportsTranscription(model)
      ) {
        throw new ModelCapabilityError(model, "transcription");
      }

      const response = await provider.transcribe({
        file: currentFile,
        ...options,
        model,
        requestTimeout: options?.requestTimeout ?? this.config.requestTimeout
      });

      const transcriptionResult = new Transcription(response);
      await runMiddleware(middlewares, "onResponse", context, transcriptionResult as any);

      return transcriptionResult;
    } catch (error) {
      await runMiddleware(middlewares, "onError", context, error as Error);
      throw error;
    }
  }

  async moderate(
    input: string | string[],
    options?: {
      model?: string;
      assumeModelExists?: boolean;
      requestTimeout?: number;
      middlewares?: Middleware[];
    }
  ): Promise<Moderation> {
    const provider = this.ensureProviderSupport("moderate");

    const rawModel =
      options?.model || this.defaults.moderation || provider.defaultModel("moderation");
    const model = resolveModelAlias(rawModel, provider.id);

    const requestId = randomUUID();
    const state: Record<string, unknown> = {};

    const context: MiddlewareContext = {
      requestId,
      provider: provider.id,
      model,
      input,
      moderationOptions: options,
      state
    };

    const middlewares = [...this.middlewares, ...(options?.middlewares || [])];

    try {
      await runMiddleware(middlewares, "onRequest", context);

      const currentInput = (context.input as string | string[]) || input;

      if (options?.assumeModelExists) {
        logger.warn(`Skipping validation for model ${model}`);
      } else if (
        model &&
        provider.capabilities &&
        !provider.capabilities.supportsModeration(model)
      ) {
        throw new ModelCapabilityError(model, "moderation");
      }

      const response = await provider.moderate({
        input: currentInput,
        ...options,
        model,
        requestTimeout: options?.requestTimeout ?? this.config.requestTimeout
      });

      const moderationResult = new Moderation(response);
      await runMiddleware(middlewares, "onResponse", context, moderationResult as any);

      return moderationResult;
    } catch (error) {
      await runMiddleware(middlewares, "onError", context, error as Error);
      throw error;
    }
  }

  async embed(
    input: string | string[],
    options?: {
      model?: string;
      dimensions?: number;
      assumeModelExists?: boolean;
      requestTimeout?: number;
      middlewares?: Middleware[];
    }
  ): Promise<Embedding> {
    const provider = this.ensureProviderSupport("embed");

    const rawModel =
      options?.model || this.defaults.embedding || provider.defaultModel("embedding");
    const model = resolveModelAlias(rawModel, provider.id);

    const requestId = randomUUID();
    const state: Record<string, unknown> = {};

    const context: MiddlewareContext = {
      requestId,
      provider: provider.id,
      model,
      input,
      embeddingOptions: options,
      state
    };

    const middlewares = [...this.middlewares, ...(options?.middlewares || [])];

    try {
      await runMiddleware(middlewares, "onRequest", context);

      // Re-read input from context as it might have been modified
      const currentInput = context.input || input;

      const request: EmbeddingRequest = {
        input: currentInput,
        model,
        dimensions: options?.dimensions,
        requestTimeout: options?.requestTimeout ?? this.config.requestTimeout
      };

      if (options?.assumeModelExists) {
        logger.warn(`Skipping validation for model ${request.model}`);
      } else if (
        request.model &&
        provider.capabilities &&
        !provider.capabilities.supportsEmbeddings(request.model)
      ) {
        throw new ModelCapabilityError(request.model, "embeddings");
      }

      const response = await provider.embed(request);
      const embeddingResult = new Embedding(response);

      await runMiddleware(middlewares, "onResponse", context, embeddingResult as any);

      return embeddingResult;
    } catch (error) {
      await runMiddleware(middlewares, "onError", context, error as Error);
      throw error;
    }
  }
}

export { Transcription, Moderation, Embedding, ModelRegistry, PricingRegistry };

/**
 * Creates a new immutable LLM instance.
 */
export function createLLM(options: LLMConfig = {}): NodeLLMCore {
  // 1. Resolve Configuration
  // We must ensure we are working with a SNAPSHOT of the configuration,
  // not a live reference to the global mutable Configuration instance.
  let configSnapshot: NodeLLMConfig;

  if (options instanceof Configuration) {
    configSnapshot = options.toPlainObject();
  } else {
    // If it's a plain object, we merge it into a fresh Configuration to handle
    // defaults and environment variable fallbacks correctly, then snapshot it.
    const tempConfig = new Configuration();
    Object.assign(tempConfig, options);
    configSnapshot = tempConfig.toPlainObject();
  }

  // Use the snapshot for the rest of the logic
  const baseConfig = configSnapshot;

  // 2. Resolve Retry
  let retry: Required<RetryOptions> = { attempts: 1, delayMs: 0 };
  if (baseConfig.maxRetries !== undefined) {
    retry.attempts = baseConfig.maxRetries + 1;
  }
  if (options.retry) {
    retry = {
      attempts: options.retry.attempts ?? retry.attempts,
      delayMs: options.retry.delayMs ?? retry.delayMs
    };
  }

  // 3. Resolve Provider
  let providerInstance: Provider | undefined;
  if (typeof options.provider === "string") {
    const registrar = PROVIDER_REGISTRARS[options.provider];
    if (registrar) registrar();
    providerInstance = providerRegistry.resolve(options.provider, baseConfig);
  } else if (options.provider) {
    providerInstance = options.provider;
  }

  // 4. Resolve Defaults
  const defaults = {
    chat: options.defaultChatModel,
    transcription: options.defaultTranscriptionModel,
    moderation: options.defaultModerationModel,
    embedding: options.defaultEmbeddingModel
  };

  return new NodeLLMCore(baseConfig, providerInstance, retry, options.middlewares || [], defaults);
}

/**
 * DEFAULT IMMUTABLE INSTANCE
 *
 * NodeLLM is a default immutable instance created at startup.
 *
 * **Architectural Contract**:
 * - Configuration is captured from environment variables at module load time
 * - The instance is frozen and cannot be mutated
 * - Runtime provider switching is achieved via `withProvider()`, not mutation
 * - Model names do NOT imply provider selection (provider must be explicit)
 *
 * **Usage Patterns**:
 *
 * 1. Using the default instance (if env vars are set):
 * ```typescript
 * import { NodeLLM } from '@node-llm/core';
 * const chat = NodeLLM.chat("gpt-4");
 * ```
 *
 * 2. Runtime provider switching (recommended):
 * ```typescript
 * const llm = NodeLLM.withProvider("openai", {
 *   openaiApiKey: process.env.OPENAI_API_KEY
 * });
 * const chat = llm.chat("gpt-4");
 * ```
 *
 * 3. Creating custom instances:
 * ```typescript
 * import { createLLM } from '@node-llm/core';
 * const llm = createLLM({ provider: "anthropic", anthropicApiKey: "..." });
 * ```
 *
 * @see ARCHITECTURE.md for full contract details
 */
let _defaultInstance: NodeLLMCore | undefined;

/**
 * The global, immutable NodeLLM instance.
 *
 * DESIGN: Lazy Initialization
 * To support 'import "dotenv/config"' patterns in ESM, this instance
 * does NOT snapshot the environment until its first property access.
 * Once accessed, it is frozen and becomes a stable, immutable contract.
 *
 * @see ARCHITECTURE.md for full contract details
 */
export const NodeLLM: NodeLLMCore = new Proxy({} as NodeLLMCore, {
  get: (target, prop) => {
    if (!_defaultInstance) {
      _defaultInstance = createLLM(config);
      Object.freeze(_defaultInstance);
    }
    const val = Reflect.get(_defaultInstance, prop);
    // Only bind if it's a function AND it exists on the prototype (is a method)
    // This avoids binding properties like 'models' which is a Class.
    if (typeof val === "function" && prop in NodeLLMCore.prototype) {
      return val.bind(_defaultInstance);
    }
    return val;
  },
  getPrototypeOf: () => NodeLLMCore.prototype,
  getOwnPropertyDescriptor: (target, prop) => {
    if (!_defaultInstance) {
      _defaultInstance = createLLM(config);
      Object.freeze(_defaultInstance);
    }
    return Object.getOwnPropertyDescriptor(_defaultInstance, prop);
  },
  ownKeys: () => {
    if (!_defaultInstance) {
      _defaultInstance = createLLM(config);
      Object.freeze(_defaultInstance);
    }
    return Reflect.ownKeys(_defaultInstance);
  }
});

/**
 * LEGACY BOOTSTRAPPER (DEPRECATED)
 *
 * Provided to ease migration from the mutable singleton pattern.
 * configure() will warn and no-op, as the global instance is now immutable.
 */
export const LegacyNodeLLM = {
  configure(_options: LLMConfig | ((config: NodeLLMConfig) => void)) {
    console.warn(
      "NodeLLM.configure() is deprecated and currently a NO-OP. " +
        "The global NodeLLM instance is now immutable. " +
        "Use createLLM() for instance-based LLMs or NodeLLM.withProvider() for runtime switching."
    );
  }
};
