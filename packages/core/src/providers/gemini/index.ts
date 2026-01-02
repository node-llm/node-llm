import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { GeminiProvider } from "./GeminiProvider.js";

let registered = false;

/**
 * Idempotent registration of the Gemini provider.
 * Automatically called by LLM.configure({ provider: 'gemini' })
 */
export function registerGeminiProvider() {
  if (registered) return;

  providerRegistry.register("gemini", () => {
    const apiKey = config.geminiApiKey;

    if (!apiKey) {
      throw new Error("geminiApiKey is not set in config or GEMINI_API_KEY environment variable");
    }

    return new GeminiProvider({ apiKey });
  });

  registered = true;
}

/**
 * Alias for registerGeminiProvider for internal use.
 */
export const ensureGeminiRegistered = registerGeminiProvider;

export * from "./GeminiProvider.js";
