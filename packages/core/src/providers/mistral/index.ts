import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { MistralProvider } from "./MistralProvider.js";

export * from "./MistralProvider.js";
export * from "./Chat.js";
export * from "./Models.js";
export * from "./Capabilities.js";
export * from "./Embedding.js";

let registered = false;

export function registerMistralProvider() {
  if (registered) return;

  providerRegistry.register("mistral", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.mistralApiKey;
    const baseUrl = cfg.mistralApiBase;

    if (!apiKey) {
      throw new Error(
        "mistral_api_key is not set in config or MISTRAL_API_KEY environment variable"
      );
    }

    return new MistralProvider({ apiKey, baseUrl });
  });

  registered = true;
}

export const ensureMistralRegistered = registerMistralProvider;
