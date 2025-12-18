import { Chat } from "./chat/Chat.js";
import { ChatOptions } from "./chat/ChatOptions.js";
import { Provider } from "./providers/Provider.js";
import { providerRegistry } from "./providers/registry.js";
import { ensureOpenAIRegistered } from "./providers/openai/register.js";

type LLMConfig =
  | { provider: Provider }
  | { provider: string };

class LLMCore {
  private provider?: Provider;

  configure(config: LLMConfig) {
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
}

export const LLM = new LLMCore();
