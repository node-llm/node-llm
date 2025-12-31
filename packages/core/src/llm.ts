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
import { GeneratedImage } from "./image/GeneratedImage.js";
import { models, ModelRegistry } from "./models/ModelRegistry.js";
import { Transcription } from "./transcription/Transcription.js";
import { Moderation } from "./moderation/Moderation.js";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig =
  | { provider: Provider; retry?: RetryOptions; defaultTranscriptionModel?: string; defaultModerationModel?: string }
  | { provider: string; retry?: RetryOptions; defaultTranscriptionModel?: string; defaultModerationModel?: string };

class LLMCore {
  public readonly models: ModelRegistry = models;
  private provider?: Provider;
  private defaultTranscriptionModelId?: string;
  private defaultModerationModelId?: string;
   
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

      this.provider = providerRegistry.resolve(config.provider);
    } else {
      this.provider = config.provider;
    }
  }

  chat(model: string, options?: ChatOptions): Chat {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }

    return new Chat(this.provider, model, options);
  }

  async listModels(): Promise<ModelInfo[]> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.listModels) {
      throw new Error(`Provider does not support listModels`);
    }
    return this.provider.listModels();
  }

  async paint(prompt: string, options?: { model?: string; size?: string; quality?: string }): Promise<GeneratedImage> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.paint) {
      throw new Error(`Provider does not support paint`);
    }

    const response = await this.provider.paint({
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
    }
  ): Promise<Transcription> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.transcribe) {
      throw new Error(`Provider does not support transcribe`);
    }

    const response = await this.provider.transcribe({
      file,
      model: options?.model || this.defaultTranscriptionModelId,
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

  getRetryConfig() {
    return this.retry;
  }

  async moderate(input: string | string[], options?: { model?: string }): Promise<Moderation> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.moderate) {
      throw new Error(`Provider does not support moderate`);
    }

    const response = await this.provider.moderate({
      input,
      model: options?.model || this.defaultModerationModelId,
      ...options,
    });

    return new Moderation(response);
  }
}

export { Transcription, Moderation };

export const LLM = new LLMCore();
