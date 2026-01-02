import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OllamaProvider } from "./OllamaProvider.js";

export { OllamaProvider };

let registered = false;

/**
 * Idempotent registration of the Ollama provider.
 * Automatically called by LLM.configure({ provider: 'ollama' })
 */
export function registerOllamaProvider() {
  if (registered) return;

  providerRegistry.register("ollama", () => {
    return new OllamaProvider();
  });

  registered = true;
}

export const ensureOllamaRegistered = registerOllamaProvider;
