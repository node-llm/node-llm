import { checkApiBase, OPENAI_COMPATIBLE_ENDPOINTS } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { MistralProvider } from "./MistralProvider.js";

export * from "./MistralProvider.js";
export * from "./Chat.js";
export * from "./Models.js";
export * from "./Capabilities.js";
export * from "./Embedding.js";
export * from "./Transcription.js";
export * from "./Moderation.js";

let registered = false;

export function registerMistralProvider() {
  if (registered) return;

  providerRegistry.register("mistral", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.mistralApiKey;
    const baseUrl = checkApiBase("mistralApiBase", cfg.mistralApiBase, {
      example: "https://api.mistral.ai/v1",
      endpoints: OPENAI_COMPATIBLE_ENDPOINTS
    });

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
