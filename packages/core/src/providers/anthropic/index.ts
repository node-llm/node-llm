import { checkApiBase } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { AnthropicProvider } from "./AnthropicProvider.js";

export function registerAnthropicProvider() {
  providerRegistry.register("anthropic", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.anthropicApiKey;
    if (!apiKey) {
      throw new Error(
        "anthropicApiKey is not set in config or ANTHROPIC_API_KEY environment variable"
      );
    }
    return new AnthropicProvider({
      apiKey: apiKey.trim(),
      baseUrl: checkApiBase("anthropicApiBase", cfg.anthropicApiBase, {
        example: "https://api.anthropic.com/v1",
        endpoints: /\/messages$/
      })
    });
  });
}
