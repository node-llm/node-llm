import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { DeepSeekProvider } from "./DeepSeekProvider.js";

export * from "./DeepSeekProvider.js";
export * from "./Chat.js";
export * from "./Models.js";
export * from "./Capabilities.js";

let registered = false;

export function registerDeepSeekProvider() {
  if (registered) return;

  providerRegistry.register("deepseek", () => {
    const apiKey = config.deepseekApiKey;
    const baseUrl = config.deepseekApiBase; // Optional override

    if (!apiKey) {
      throw new Error("deepseek_api_key is not set in config or DEEPSEEK_API_KEY environment variable");
    }

    return new DeepSeekProvider({ apiKey, baseUrl });
  });

  registered = true;
}

export const ensureDeepSeekRegistered = registerDeepSeekProvider;
