import { Chat } from "./chat/Chat.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import {
  Provider,
  ModelInfo,
  TranscriptionResponse,
  TranscriptionSegment,
  ModerationResponse,
  ModerationResult,
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
import { DEFAULT_MODELS } from "./constants.js";
import { 
  ProviderNotConfiguredError, 
  UnsupportedFeatureError,
  ModelCapabilityError 
} from "./errors/index.js";

import { config, NodeLLMConfig } from "./config.js";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig = {
  provider?: Provider | string;
  retry?: RetryOptions;
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

class LLMCore {
  public readonly models = ModelRegistry;
  public readonly config = config;
  private provider?: Provider;
  private defaultTranscriptionModelId?: string;
  private defaultModerationModelId?: string;
  private defaultEmbeddingModelId?: string;
   
  private retry: Required<RetryOptions> = {
    attempts: 1,
    delayMs: 0,
  };

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
      defaultTranscriptionModel, 
      defaultModerationModel, 
      defaultEmbeddingModel, 
      ...apiConfig 
    } = options;

    // Merge API keys into global config
    Object.assign(this.config, apiConfig);
    
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

  chat(model: string, options?: ChatOptions): Chat {
    if (!this.provider) {
      throw new ProviderNotConfiguredError();
    }

    return new Chat(this.provider, model, options);
  }

  async listModels(): Promise<ModelInfo[]> {
    const provider = this.ensureProviderSupport("listModels");
    const models = await provider.listModels();
    
    // Dynamically update the model registry with the fetched info
    ModelRegistry.save(models as any);
    
    return models;
  }

  async paint(prompt: string, options?: { model?: string; size?: string; quality?: string; assumeModelExists?: boolean }): Promise<GeneratedImage> {
    const provider = this.ensureProviderSupport("paint");

    const model = options?.model;
    if (options?.assumeModelExists) {
      console.warn(`[NodeLLM] Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsImageGeneration(model)) {
      throw new ModelCapabilityError(model, "image generation");
    }

    const response = await provider.paint({
      prompt,
      ...options,
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
    }
  ): Promise<Transcription> {
    const provider = this.ensureProviderSupport("transcribe");

    const model = options?.model || this.defaultTranscriptionModelId;
    if (options?.assumeModelExists) {
       console.warn(`[NodeLLM] Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsTranscription(model)) {
      throw new ModelCapabilityError(model, "transcription");
    }

    const response = await provider.transcribe({
      file,
      model,
      ...options,
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

  async moderate(input: string | string[], options?: { model?: string; assumeModelExists?: boolean }): Promise<Moderation> {
    const provider = this.ensureProviderSupport("moderate");

    const model = options?.model || this.defaultModerationModelId;
    if (options?.assumeModelExists) {
      console.warn(`[NodeLLM] Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsModeration(model)) {
      throw new ModelCapabilityError(model, "moderation");
    }

    const response = await provider.moderate({
      input,
      model,
      ...options,
    });

    return new Moderation(response);
  }

  async embed(
    input: string | string[],
    options?: { model?: string; dimensions?: number; assumeModelExists?: boolean }
  ): Promise<Embedding> {
    const provider = this.ensureProviderSupport("embed");

    const model = options?.model || this.defaultEmbeddingModelId;

    const request: EmbeddingRequest = {
      input,
      model,
      dimensions: options?.dimensions,
    };

    if (options?.assumeModelExists) {
      console.warn(`[NodeLLM] Skipping validation for model ${request.model}`);
    } else if (request.model && provider.capabilities && !provider.capabilities.supportsEmbeddings(request.model)) {
      throw new ModelCapabilityError(request.model, "embeddings");
    }

    const response = await provider.embed(request);
    return new Embedding(response);
  }
}

export { Transcription, Moderation, Embedding };

export const LLM = new LLMCore();
