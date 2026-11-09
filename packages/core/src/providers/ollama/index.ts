import { checkApiBase, OPENAI_COMPATIBLE_ENDPOINTS } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OllamaProvider } from "./OllamaProvider.js";

export { OllamaProvider };

let registered = false;

/**
 * Idempotent registration of the Ollama provider.
 * Automatically called when using createLLM({ provider: 'ollama' })
 */
export function registerOllamaProvider() {
  if (registered) return;

  providerRegistry.register("ollama", (config) => {
    const cfg = config || globalConfig;
    return new OllamaProvider({
      baseUrl: checkApiBase("ollamaApiBase", cfg.ollamaApiBase, {
        example: "http://localhost:11434/v1",
        endpoints: OPENAI_COMPATIBLE_ENDPOINTS
      })
    });
  });

  registered = true;
}

export const ensureOllamaRegistered = registerOllamaProvider;
