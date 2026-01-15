import { Chat } from "./chat/Chat.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import {
  Provider,
  ModelInfo,
  TranscriptionResponse,
  ModerationResponse,
  EmbeddingResponse
} from "./providers/Provider.js";
import {
  providerRegistry,
  ensureOpenAIRegistered,
  registerAnthropicProvider,
  registerGeminiProvider,
  registerDeepSeekProvider,
  registerOllamaProvider,
  registerOpenRouterProvider,
} from "./providers/registry.js";
import { GeneratedImage } from "./image/GeneratedImage.js";
import { ModelRegistry } from "./models/ModelRegistry.js";
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

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig = {
  provider?: Provider | string;
  retry?: RetryOptions;
  defaultChatModel?: string;
  defaultTranscriptionModel?: string;
  defaultModerationModel?: string;
  defaultEmbeddingModel?: string;
} & Partial<NodeLLMConfig>;

// Provider registration map
const PROVIDER_REGISTRARS: Record<string, () => void> = {
  openai: ensureOpenAIRegistered,
  gemini: registerGeminiProvider,
  anthropic: registerAnthropicProvider,
  deepseek: registerDeepSeekProvider,
  ollama: registerOllamaProvider,
  openrouter: registerOpenRouterProvider,
};

export class NodeLLMCore {
  public readonly models = ModelRegistry;
  public readonly config: NodeLLMConfig;
  private provider?: Provider;
  private defaultChatModelId?: string;
  private defaultTranscriptionModelId?: string;
  private defaultModerationModelId?: string;
  private defaultEmbeddingModelId?: string;
   
  private retry: Required<RetryOptions> = {
    attempts: 1,
    delayMs: 0,
  };

  /**
   * Create a new LLM instance. Defaults to the global config.
   */
  constructor(customConfig?: NodeLLMConfig) {
    if (customConfig instanceof Configuration) {
      this.config = customConfig;
    } else if (customConfig) {
      this.config = new Configuration();
      Object.assign(this.config, customConfig);
    } else {
      this.config = config;
    }
    
    if (this.config.maxRetries !== undefined) {
      this.retry.attempts = this.config.maxRetries + 1;
    }
  }

  /**
   * Returns a scoped LLM instance configured for a specific provider.
   * This respects the current global configuration but avoids side effects 
   * on the main NodeLLM singleton.
   * 
   * @param providerName - The provider to use (e.g., "openai", "anthropic")
   * @param scopedConfig - Optional configuration overrides for this scoped instance
   * 
   * @example
   * ```ts
   * const openai = NodeLLM.withProvider("openai");
   * const anthropic = NodeLLM.withProvider("anthropic");
   * 
   * // These can now run in parallel without race conditions
   * await Promise.all([
   *   openai.chat("gpt-4o").ask(prompt),
   *   anthropic.chat("claude-3-5-sonnet").ask(prompt),
   * ]);
   * ```
   * 
   * @example With scoped credentials
   * ```ts
   * const customAnthropic = NodeLLM.withProvider("anthropic", {
   *   anthropicApiKey: "sk-ant-custom-key"
   * });
   * ```
   */
  withProvider(providerName: string, scopedConfig?: Partial<NodeLLMConfig>): NodeLLMCore {
    const baseConfig = (this.config instanceof Configuration) ? this.config.toPlainObject() : this.config;
    const scoped = new NodeLLMCore({ ...baseConfig, ...scopedConfig });
    scoped.configure({ provider: providerName });
    return scoped;
  }

  /**
   * Register a custom LLM provider.
   * This allows you to extend NodeLLM with your own logic at runtime.
   * 
   * @param name - Unique identifier for the provider
   * @param factory - A function that returns a Provider instance
   */
  registerProvider(name: string, factory: () => Provider): void {
    providerRegistry.register(name, factory);
  }

  configure(configOrCallback: LLMConfig | ((config: NodeLLMConfig) => void)) {
    // Callback style: for setting API keys
    if (typeof configOrCallback === "function") {
      configOrCallback(this.config);
      return;
    }

    // Object style: for setting provider and other options
    const options = configOrCallback;

    // Extract known control keys
    const { 
      provider, 
      retry, 
      defaultChatModel,
      defaultTranscriptionModel, 
      defaultModerationModel, 
      defaultEmbeddingModel, 
      ...apiConfig 
    } = options;

    // Merge API keys into global config
    Object.assign(this.config, apiConfig);

    if (apiConfig.maxRetries !== undefined) {
      this.retry.attempts = apiConfig.maxRetries + 1;
    }
    
    if (defaultChatModel) {
      this.defaultChatModelId = defaultChatModel;
    }

    if (defaultTranscriptionModel) {
      this.defaultTranscriptionModelId = defaultTranscriptionModel;
    }

    if (defaultModerationModel) {
      this.defaultModerationModelId = defaultModerationModel;
    }

    if (defaultEmbeddingModel) {
      this.defaultEmbeddingModelId = defaultEmbeddingModel;
    }

    if (retry) {
      this.retry = {
        attempts: retry.attempts ?? 1,
        delayMs: retry.delayMs ?? 0,
      };
    }

    if (typeof provider === "string") {
      // Use the provider registrars map
      const registrar = PROVIDER_REGISTRARS[provider];
      if (registrar) {
        registrar();
      }
      
      this.provider = providerRegistry.resolve(provider);
    } else if (provider) {
      this.provider = provider;
    }
  }

  private ensureProviderSupport<K extends keyof Provider>(method: K): Provider & Record<K, NonNullable<Provider[K]>> {
    if (!this.provider) {
      throw new ProviderNotConfiguredError();
    }
    if (!this.provider[method]) {
      throw new UnsupportedFeatureError(
        "Provider",
        String(method)
      );
    }
    return this.provider as Provider & Record<K, NonNullable<Provider[K]>>;
  }

  chat(model?: string, options?: ChatOptions): Chat {
    if (!this.provider) {
      throw new ProviderNotConfiguredError();
    }

    const rawModel = model || this.defaultChatModelId || this.provider.defaultModel("chat");
    const resolvedModel = resolveModelAlias(rawModel, this.provider.id);
    return new Chat(this.provider, resolvedModel, options, this.retry);
  }

  async listModels(): Promise<ModelInfo[]> {
    const provider = this.ensureProviderSupport("listModels");
    const models = await provider.listModels();
    
    // Dynamically update the model registry with the fetched info
    ModelRegistry.save(models as any);
    
    return models;
  }

  async paint(prompt: string, options?: { model?: string; size?: string; quality?: string; assumeModelExists?: boolean; requestTimeout?: number }): Promise<GeneratedImage> {
    const provider = this.ensureProviderSupport("paint");
    
    // Default to resolving aliases
    const rawModel = options?.model;
    const model = resolveModelAlias(rawModel || "", provider.id);

    if (options?.assumeModelExists) {
      logger.warn(`Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsImageGeneration(model)) {
      throw new ModelCapabilityError(model, "image generation");
    }

    const response = await provider.paint({
      prompt,
      ...options,
      model,
      requestTimeout: options?.requestTimeout ?? this.config.requestTimeout,
    });

    return new GeneratedImage(response);
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
    }
  ): Promise<Transcription> {
    const provider = this.ensureProviderSupport("transcribe");

    const rawModel = options?.model || this.defaultTranscriptionModelId || "";
    const model = resolveModelAlias(rawModel, provider.id);
    if (options?.assumeModelExists) {
       logger.warn(`Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsTranscription(model)) {
      throw new ModelCapabilityError(model, "transcription");
    }

    const response = await provider.transcribe({
      file,
      ...options,
      model,
      requestTimeout: options?.requestTimeout ?? this.config.requestTimeout,
    });

    return new Transcription(response);
  }

  get defaultTranscriptionModel(): string | undefined {
    return this.defaultTranscriptionModelId;
  }

  get defaultModerationModel(): string | undefined {
    return this.defaultModerationModelId;
  }

  get defaultEmbeddingModel(): string | undefined {
    return this.defaultEmbeddingModelId;
  }

  getRetryConfig() {
    return this.retry;
  }

  async moderate(input: string | string[], options?: { model?: string; assumeModelExists?: boolean; requestTimeout?: number }): Promise<Moderation> {
    const provider = this.ensureProviderSupport("moderate");

    const rawModel = options?.model || this.defaultModerationModelId || "";
    const model = resolveModelAlias(rawModel, provider.id);
    if (options?.assumeModelExists) {
      logger.warn(`Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsModeration(model)) {
      throw new ModelCapabilityError(model, "moderation");
    }

    const response = await provider.moderate({
      input,
      ...options,
      model,
      requestTimeout: options?.requestTimeout ?? this.config.requestTimeout,
    });

    return new Moderation(response);
  }

  async embed(
    input: string | string[],
    options?: { model?: string; dimensions?: number; assumeModelExists?: boolean; requestTimeout?: number }
  ): Promise<Embedding> {
    const provider = this.ensureProviderSupport("embed");

    const rawModel = options?.model || this.defaultEmbeddingModelId || "";
    const model = resolveModelAlias(rawModel, provider.id);

    const request: EmbeddingRequest = {
      input,
      model,
      dimensions: options?.dimensions,
      requestTimeout: options?.requestTimeout ?? this.config.requestTimeout,
    };

    if (options?.assumeModelExists) {
      logger.warn(`Skipping validation for model ${request.model}`);
    } else if (request.model && provider.capabilities && !provider.capabilities.supportsEmbeddings(request.model)) {
      throw new ModelCapabilityError(request.model, "embeddings");
    }

    const response = await provider.embed(request);
    return new Embedding(response);
  }
}

export { Transcription, Moderation, Embedding };

export const NodeLLM = new NodeLLMCore();
