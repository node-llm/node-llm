import { checkApiBase, OPENAI_COMPATIBLE_ENDPOINTS } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";

export * from "./OpenRouterProvider.js";

let registered = false;

/**
 * Idempotent registration of the OpenRouter provider.
 * Automatically called when using createLLM({ provider: 'openrouter' })
 */
export function registerOpenRouterProvider() {
  if (registered) return;

  providerRegistry.register("openrouter", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.openrouterApiKey;
    const baseUrl = checkApiBase("openrouterApiBase", cfg.openrouterApiBase, {
      example: "https://openrouter.ai/api/v1",
      endpoints: OPENAI_COMPATIBLE_ENDPOINTS
    });

    if (!apiKey) {
      throw new Error(
        "openrouterApiKey is not set in config or OPENROUTER_API_KEY environment variable"
      );
    }

    return new OpenRouterProvider({ apiKey, baseUrl });
  });

  registered = true;
}

/**
 * Alias for registerOpenRouterProvider for internal use.
 */
export const ensureOpenRouterRegistered = registerOpenRouterProvider;
