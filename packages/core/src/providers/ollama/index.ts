
import { config } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { OpenAIProvider } from "../openai/OpenAIProvider.js";

let registered = false;

/**
 * Idempotent registration of the Ollama provider.
 * Automatically called by LLM.configure({ provider: 'ollama' })
 */
export function registerOllamaProvider() {
  if (registered) return;

  providerRegistry.register("ollama", () => {
    // Ollama is fully OpenAI-compatible.
    // We use "ollama" as a dummy API key since it's required by the OpenAIProvider
    // but typically ignored by the local Ollama instance (unless configured otherwise).
    return new OpenAIProvider({
      apiKey: "ollama",
      baseUrl: config.ollamaApiBase || "http://localhost:11434/v1",
      providerName: "ollama"
    });
  });

  registered = true;
}

export const ensureOllamaRegistered = registerOllamaProvider;
