import { ModelRegistry } from "./ModelRegistry.js";
import { ModelPricing } from "./types.js";

/**
 * Registry for LLM pricing information.
 * Priority: Runtime Overrides > Library Default Patterns > ModelRegistry (models.ts)
 */
export class PricingRegistry {
  private static pricingOverrides = new Map<string, ModelPricing>();
  private static lastUpdated: Date | null = new Date();

  // Library-level fallbacks for common model families
  private static DEFAULT_PATTERNS: Array<{
    pattern: RegExp;
    provider: string;
    pricing: ModelPricing;
  }> = [
    {
      provider: "anthropic",
      pattern: /claude-3-7/,
      pricing: {
        text_tokens: {
          standard: {
            input_per_million: 3.0,
            output_per_million: 15.0,
            reasoning_output_per_million: 37.5
          },
          batch: {
            input_per_million: 1.5,
            output_per_million: 7.5,
            reasoning_output_per_million: 18.75
          }
        }
      }
    },
    {
      provider: "anthropic",
      pattern: /claude-3/,
      pricing: {
        text_tokens: {
          standard: { input_per_million: 3.0, output_per_million: 15.0 },
          batch: { input_per_million: 1.5, output_per_million: 7.5 }
        }
      }
    },
    {
      provider: "openai",
      pattern: /gpt-3/,
      pricing: {
        text_tokens: { standard: { input_per_million: 0.5, output_per_million: 1.5 } }
      }
    }
  ];

  /**
   * Get pricing for a model.
   */
  static getPricing(modelId: string, provider: string): ModelPricing | undefined {
    // 1. Check custom overrides (Runtime/Remote)
    const key = `${provider.toLowerCase()}/${modelId.toLowerCase()}`;
    if (this.pricingOverrides.has(key)) {
      return this.pricingOverrides.get(key);
    }

    // 2. Check library default patterns (Core Overrides)
    for (const entry of this.DEFAULT_PATTERNS) {
      if (entry.provider.toLowerCase() === provider.toLowerCase() && entry.pattern.test(modelId)) {
        return entry.pricing;
      }
    }

    // 3. Fallback to registry lookup (models.ts)
    const model = ModelRegistry.find(modelId, provider);
    return model?.pricing;
  }

  /**
   * Register or override pricing at runtime.
   */
  static register(provider: string, modelId: string, pricing: ModelPricing) {
    this.pricingOverrides.set(`${provider.toLowerCase()}/${modelId.toLowerCase()}`, pricing);
  }

  /**
   * Fetch updates from a remote URL.
   */
  static async fetchUpdates(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      if (data.models) {
        for (const [key, pricing] of Object.entries(data.models)) {
          const [provider, modelId] = key.split("/");
          if (provider && modelId) this.register(provider, modelId, pricing as ModelPricing);
        }
      }
      this.lastUpdated = new Date();
      return true;
    } catch (error) {
      console.error("[NodeLLM] Error fetching pricing updates:", error);
      return false;
    }
  }

  /**
   * Get the timestamp of the last update.
   */
  static getLastUpdated(): Date | null {
    return this.lastUpdated;
  }

  /**
   * Reset overrides.
   */
  static reset() {
    this.pricingOverrides.clear();
    this.lastUpdated = new Date();
  }
}
