import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";

export * from "./OpenRouterProvider.js";

let registered = false;

/**
 * Idempotent registration of the OpenRouter provider.
 * Automatically called by LLM.configure({ provider: 'openrouter' })
 */
export function registerOpenRouterProvider() {
  if (registered) return;

  providerRegistry.register("openrouter", () => {
    const apiKey = config.openrouterApiKey;
    const baseUrl = config.openrouterApiBase;

    if (!apiKey) {
      throw new Error("openrouterApiKey is not set in config or OPENROUTER_API_KEY environment variable");
    }

    return new OpenRouterProvider({ apiKey, baseUrl });
  });

  registered = true;
}

/**
 * Alias for registerOpenRouterProvider for internal use.
 */
export const ensureOpenRouterRegistered = registerOpenRouterProvider;
