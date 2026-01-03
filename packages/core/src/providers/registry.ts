import { Provider } from "./Provider.js";
import { registerOpenAIProvider } from "./openai/index.js";
import { registerAnthropicProvider } from "./anthropic/index.js";
import { registerGeminiProvider } from "./gemini/index.js";
import { registerDeepSeekProvider } from "./deepseek/index.js";
import { registerOllamaProvider } from "./ollama/index.js";
import { registerOpenRouterProvider } from "./openrouter/index.js";

type ProviderFactory = () => Provider;

class ProviderRegistry {
  private providers = new Map<string, ProviderFactory>();

  /**
   * Register a provider factory
   */
  register(name: string, factory: ProviderFactory): void {
    if (this.providers.has(name)) {
      return;
    }

    this.providers.set(name, factory);
  }

  /**
   * Resolve a provider by name
   */
  resolve(name: string): Provider {
    const factory = this.providers.get(name);

    if (!factory) {
      throw new Error(`Unknown LLM provider '${name}'`);
    }

    return factory();
  }

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Introspection / debugging
   */
  list(): string[] {
    return [...this.providers.keys()];
  }
}

export const providerRegistry = new ProviderRegistry();

// Exported registration functions (delegates to provider-specific index files)
export { 
  registerOpenAIProvider as ensureOpenAIRegistered,
  registerOpenAIProvider,
  registerAnthropicProvider,
  registerGeminiProvider,
  registerDeepSeekProvider,
  registerOllamaProvider,
  registerOpenRouterProvider
};
