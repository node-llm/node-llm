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
import { providerRegistry } from "./providers/registry.js";
import { ensureOpenAIRegistered } from "./providers/openai/index.js";
import { registerGeminiProvider } from "./providers/gemini/index.js";
import { registerAnthropicProvider } from "./providers/anthropic/index.js";
import { GeneratedImage } from "./image/GeneratedImage.js";
import { ModelRegistry } from "./models/ModelRegistry.js";
import { Transcription } from "./transcription/Transcription.js";
import { Moderation } from "./moderation/Moderation.js";
import { Embedding } from "./embedding/Embedding.js";
import { EmbeddingRequest } from "./providers/Embedding.js";
import { DEFAULT_MODELS } from "./constants.js";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig =
  | { provider: Provider; retry?: RetryOptions; defaultTranscriptionModel?: string; defaultModerationModel?: string; defaultEmbeddingModel?: string }
  | { provider: string; retry?: RetryOptions; defaultTranscriptionModel?: string; defaultModerationModel?: string; defaultEmbeddingModel?: string };

class LLMCore {
  public readonly models = ModelRegistry;
  private provider?: Provider;
  private defaultTranscriptionModelId?: string;
  private defaultModerationModelId?: string;
  private defaultEmbeddingModelId?: string;
   
  private retry: Required<RetryOptions> = {
    attempts: 1,
    delayMs: 0,
  };

  configure(config: LLMConfig) {
    if (config.defaultTranscriptionModel) {
      this.defaultTranscriptionModelId = config.defaultTranscriptionModel;
    }

    if (config.defaultModerationModel) {
      this.defaultModerationModelId = config.defaultModerationModel;
    }

    if (config.defaultEmbeddingModel) {
      this.defaultEmbeddingModelId = config.defaultEmbeddingModel;
    }

    if (config.retry) {
      this.retry = {
        attempts: config.retry.attempts ?? 1,
        delayMs: config.retry.delayMs ?? 0,
      };
    }

    if (typeof config.provider === "string") {
      if (config.provider === "openai") {
        ensureOpenAIRegistered();
      }

      if (config.provider === "gemini") {
        registerGeminiProvider();
      }

      if (config.provider === "anthropic") {
        registerAnthropicProvider();
      }

      this.provider = providerRegistry.resolve(config.provider);
    } else {
      this.provider = config.provider;
    }
  }

  private ensureProviderSupport<K extends keyof Provider>(method: K): Provider & Record<K, NonNullable<Provider[K]>> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider[method]) {
      throw new Error(`Provider does not support ${method}`);
    }
    return this.provider as Provider & Record<K, NonNullable<Provider[K]>>;
  }

  chat(model: string, options?: ChatOptions): Chat {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }

    return new Chat(this.provider, model, options);
  }

  async listModels(): Promise<ModelInfo[]> {
    const provider = this.ensureProviderSupport("listModels");
    return provider.listModels();
  }

  async paint(prompt: string, options?: { model?: string; size?: string; quality?: string; assumeModelExists?: boolean }): Promise<GeneratedImage> {
    const provider = this.ensureProviderSupport("paint");

    const model = options?.model;
    if (options?.assumeModelExists) {
      console.warn(`[NodeLLM] Skipping validation for model ${model}`);
    } else if (model && provider.capabilities && !provider.capabilities.supportsImageGeneration(model)) {
      throw new Error(`Model ${model} does not support image generation.`);
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
      throw new Error(`Model ${model} does not support transcription.`);
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
      throw new Error(`Model ${model} does not support moderation.`);
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
      throw new Error(`Model ${request.model} does not support embeddings.`);
    }

    const response = await provider.embed(request);
    return new Embedding(response);
  }
}

export { Transcription, Moderation, Embedding };

export const LLM = new LLMCore();
