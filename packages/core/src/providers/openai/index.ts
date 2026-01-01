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
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_API_BASE;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    return new OpenAIProvider({ apiKey, baseUrl });
  });

  registered = true;
}

/**
 * Alias for registerOpenAIProvider for internal use.
 */
export const ensureOpenAIRegistered = registerOpenAIProvider;
