import { Chat } from "./chat/Chat.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import {
  Provider,
  ModelInfo,
  TranscriptionResponse,
  TranscriptionSegment,
} from "./providers/Provider.js";
import { providerRegistry } from "./providers/registry.js";
import { ensureOpenAIRegistered } from "./providers/openai/index.js";
import { GeneratedImage } from "./image/GeneratedImage.js";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig =
  | { provider: Provider; retry?: RetryOptions; defaultTranscriptionModel?: string }
  | { provider: string; retry?: RetryOptions; defaultTranscriptionModel?: string };

export class Transcription {
  constructor(private readonly response: TranscriptionResponse) {}

  get text(): string {
    return this.response.text;
  }

  get model(): string {
    return this.response.model;
  }

  get segments(): TranscriptionSegment[] {
    return this.response.segments || [];
  }

  get duration(): number | undefined {
    return this.response.duration;
  }

  toString(): string {
    return this.text;
  }
}

class LLMCore {
  private provider?: Provider;
  private defaultModel?: string;
   
  private retry: Required<RetryOptions> = {
    attempts: 1,
    delayMs: 0,
  };

  configure(config: LLMConfig) {
    if (config.defaultTranscriptionModel) {
      this.defaultModel = config.defaultTranscriptionModel;
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

  async transcribe(file: string, options?: { model?: string; prompt?: string; language?: string }): Promise<Transcription> {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.transcribe) {
      throw new Error(`Provider does not support transcribe`);
    }

    const response = await this.provider.transcribe({
      file,
      model: options?.model || this.defaultModel,
      ...options,
    });

    return new Transcription(response);
  }

  get defaultTranscriptionModel(): string | undefined {
    return this.defaultModel;
  }

  getRetryConfig() {
    return this.retry;
  }
}

export const LLM = new LLMCore();
