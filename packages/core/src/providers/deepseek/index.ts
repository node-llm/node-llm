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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_API_BASE; // Optional override

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    return new DeepSeekProvider({ apiKey, baseUrl });
  });

  registered = true;
}

export const ensureDeepSeekRegistered = registerDeepSeekProvider;
