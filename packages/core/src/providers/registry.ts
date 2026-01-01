import { Provider } from "./Provider.js";

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
   * Introspection / debugging
   */
  list(): string[] {
    return [...this.providers.keys()];
  }
}

export const providerRegistry = new ProviderRegistry();

