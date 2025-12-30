import { Chat } from "./chat/Chat.js";
import { Stream } from "./chat/Stream.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import { Provider } from "./providers/Provider.js";
import { providerRegistry } from "./providers/registry.js";
import { ensureOpenAIRegistered } from "./providers/openai/register.js";

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
}

type LLMConfig =
  | { provider: Provider; retry?: RetryOptions }
  | { provider: string; retry?: RetryOptions };

class LLMCore {
  private provider?: Provider;
   
  private retry: Required<RetryOptions> = {
    attempts: 1,
    delayMs: 0,
  };

  configure(config: LLMConfig) {
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

  async listModels() {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.listModels) {
      throw new Error(`Provider does not support listModels`);
    }
    return this.provider.listModels();
  }

  async paint(prompt: string, options?: { model?: string; size?: string; quality?: string }) {
    if (!this.provider) {
      throw new Error("LLM provider not configured");
    }
    if (!this.provider.paint) {
      throw new Error(`Provider does not support paint`);
    }

    return this.provider.paint({
      prompt,
      ...options,
    });
  }

  getRetryConfig() {
    return this.retry;
  }
  
}

export const LLM = new LLMCore();
