import { checkApiBase, OPENAI_COMPATIBLE_ENDPOINTS } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

let registered = false;

/**
 * Idempotent registration of the OpenAI provider.
 * Automatically called when using createLLM({ provider: 'openai' })
 */
export function registerOpenAIProvider() {
  if (registered) return;

  providerRegistry.register("openai", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.openaiApiKey;
    const baseUrl = checkApiBase("openaiApiBase", cfg.openaiApiBase, {
      example: "https://api.openai.com/v1",
      endpoints: OPENAI_COMPATIBLE_ENDPOINTS
    });

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
