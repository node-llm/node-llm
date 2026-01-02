import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

let registered = false;

/**
 * Idempotent registration of the OpenAI provider.
 * Automatically called by LLM.configure({ provider: 'openai' })
 */
export function registerOpenAIProvider() {
  if (registered) return;

  providerRegistry.register("openai", () => {
    const apiKey = config.openaiApiKey;
    const baseUrl = config.openaiApiBase;

    if (!apiKey) {
      throw new Error("openaiApiKey is not set in config or OPENAI_API_KEY environment variable");
    }

    return new OpenAIProvider({ apiKey, baseUrl });
  });

  registered = true;
}

/**
 * Alias for registerOpenAIProvider for internal use.
 */
export const ensureOpenAIRegistered = registerOpenAIProvider;
