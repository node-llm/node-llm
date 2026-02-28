import { providerRegistry } from "../registry.js";
import { XAIProvider } from "./XAIProvider.js";
import { NodeLLMConfig } from "../../config.js";

export * from "./XAIProvider.js";

/**
 * Register the xAI provider.
 */
export function registerXAIProvider(config?: NodeLLMConfig) {
  providerRegistry.register("xai", (cfg?: NodeLLMConfig) => {
    const activeConfig = cfg || config;
    const apiKey = activeConfig?.xaiApiKey;

    if (!apiKey) {
      throw new Error(
        "xAI API key not found. Please provide 'xaiApiKey' in config or set XAI_API_KEY environment variable."
      );
    }

    return new XAIProvider({
      apiKey,
      baseUrl: activeConfig?.xaiApiBase
    });
  });
}
