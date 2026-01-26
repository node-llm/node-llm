import { Provider } from "./Provider.js";
import { registerOpenAIProvider } from "./openai/index.js";
import { registerAnthropicProvider } from "./anthropic/index.js";
import { registerGeminiProvider } from "./gemini/index.js";
import { registerDeepSeekProvider } from "./deepseek/index.js";
import { registerOllamaProvider } from "./ollama/index.js";
import { registerOpenRouterProvider } from "./openrouter/index.js";
import { registerBedrockProvider } from "./bedrock/index.js";

import { NodeLLMConfig } from "../config.js";

type ProviderFactory = (config?: NodeLLMConfig) => Provider;
export type ProviderInterceptor = (provider: Provider) => Provider;

class ProviderRegistry {
  private providers = new Map<string, ProviderFactory>();
  private globalInterceptor?: ProviderInterceptor;

  public setInterceptor(interceptor: ProviderInterceptor | undefined) {
    this.globalInterceptor = interceptor;
  }

  /**
   * Register a provider factory
   */
  register(name: string, factory: ProviderFactory) {
    if (this.providers.has(name)) {
      return;
    }
    this.providers.set(name, factory);
  }

  /**
   * Resolve a provider by name
   */
  resolve(name: string, config?: NodeLLMConfig): Provider {
    const factory = this.providers.get(name);

    if (!factory) {
      throw new Error(`Provider ${name} not registered`);
    }

    let provider = factory(config);

    if (this.globalInterceptor) {
      provider = this.globalInterceptor(provider);
    }

    return provider;
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

/**
 * Global provider registry.
 *
 * @internal
 * This is an internal implementation detail. Use `NodeLLM.registerProvider()`
 * or `createLLM()` instead of accessing this directly.
 *
 * **For custom providers**, use the public API:
 * ```typescript
 * import { NodeLLM, BaseProvider } from '@node-llm/core';
 *
 * class MyProvider extends BaseProvider { ... }
 * NodeLLM.registerProvider("my-provider", () => new MyProvider());
 * ```
 */
export const providerRegistry = new ProviderRegistry();

// Exported registration functions (delegates to provider-specific index files)
export {
  registerOpenAIProvider as ensureOpenAIRegistered,
  registerOpenAIProvider,
  registerAnthropicProvider,
  registerGeminiProvider,
  registerDeepSeekProvider,
  registerOllamaProvider,
  registerOpenRouterProvider,
  registerBedrockProvider
};
