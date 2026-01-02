import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { AnthropicProvider } from "./AnthropicProvider.js";

export function registerAnthropicProvider() {
  providerRegistry.register("anthropic", () => {
    const apiKey = config.anthropicApiKey;
    if (!apiKey) {
      throw new Error("anthropicApiKey is not set in config or ANTHROPIC_API_KEY environment variable");
    }
    return new AnthropicProvider({ apiKey: apiKey.trim() });
  });
}
