import { providerRegistry } from "../registry.js";
import { AnthropicProvider } from "./AnthropicProvider.js";

export function registerAnthropicProvider() {
  providerRegistry.register("anthropic", () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    return new AnthropicProvider({ apiKey: apiKey.trim() });
  });
}
