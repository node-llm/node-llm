import { Model } from "./types.js";
import modelsData from "./models.json" with { type: "json" };
import { PricingRegistry } from "./PricingRegistry.js";

export class ModelRegistry {
  private static models: Model[] = modelsData as unknown as Model[];

  static find(modelId: string, provider?: string): Model | undefined {
    // Exact match
    const exactMatch = this.models.find(
      (m) =>
        m.id.toLowerCase() === modelId.toLowerCase() &&
        (!provider || m.provider.toLowerCase() === provider.toLowerCase())
    );
    if (exactMatch) return exactMatch;

    // Fuzzy match (prefix matching)
    return this.models.find((m) => {
      if (provider && m.provider.toLowerCase() !== provider.toLowerCase()) return false;
      return (
        m.id.toLowerCase().startsWith(modelId.toLowerCase()) ||
        modelId.toLowerCase().startsWith(m.id.toLowerCase())
      );
    });
  }

  /**
   * Add or update models in the registry.
   */
  static save(models: Model | Model[]): void {
    const toAdd = Array.isArray(models) ? models : [models];

    toAdd.forEach((newModel) => {
      const index = this.models.findIndex(
        (m) => m.id === newModel.id && m.provider === newModel.provider
      );
      if (index >= 0) {
        this.models[index] = newModel;
      } else {
        this.models.push(newModel);
      }
    });
  }

  /**
   * Get all available models.
   */
  static all(): Model[] {
    return this.models;
  }

  /**
   * Get output tokens limit for a model.
   */
  static getMaxOutputTokens(modelId: string, provider: string): number | undefined {
    const model = this.find(modelId, provider);
    return model?.max_output_tokens ?? undefined;
  }

  /**
   * Check if a model supports a capability.
   */
  static supports(modelId: string, capability: string, provider: string): boolean {
    const model = this.find(modelId, provider);
    if (!model) return false;

    if (model.capabilities.includes(capability)) return true;

    // Fallback for vision: check modalities
    if (capability === "vision" && model.modalities?.input?.includes("image")) {
      return true;
    }

    // Fallback for embeddings: check modalities
    if (capability === "embeddings" && model.modalities?.output?.includes("embeddings")) {
      return true;
    }

    // Fallback for reasoning: check model ID
    if (capability === "reasoning") {
      return /o1-|o3-|reasoner|-r1|qwq|3-7/.test(modelId.toLowerCase());
    }

    return false;
  }

  /**
   * Get context window size.
   */
  static getContextWindow(modelId: string, provider: string): number | undefined {
    const model = this.find(modelId, provider);
    return model?.context_window ?? undefined;
  }

  /**
   * Calculate cost for usage.
   */
  static calculateCost(
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      cached_tokens?: number;
      reasoning_tokens?: number;
      image_tokens?: number;
    },
    modelId: string,
    provider: string
  ) {
    const pricing = PricingRegistry.getPricing(modelId, provider);
    if (!pricing) {
      return usage;
    }

    let inputCost = 0;
    let outputCost = 0;

    // 1. Text pricing
    if (pricing.text_tokens?.standard) {
      const prices = pricing.text_tokens.standard;
      const inputPrice = prices.input_per_million || 0;
      const outputPrice = prices.output_per_million || 0;

      const reasoningPrice =
        prices.reasoning_output_per_million ??
        (modelId.includes("reasoner") || modelId.includes("3-7") ? outputPrice * 2.5 : outputPrice);

      const cachedPrice = prices.cached_input_per_million ?? inputPrice / 2;

      inputCost +=
        ((usage.input_tokens - (usage.cached_tokens || 0)) / 1_000_000) * inputPrice +
        ((usage.cached_tokens || 0) / 1_000_000) * cachedPrice;

      const outputTokens = usage.output_tokens - (usage.reasoning_tokens || 0);
      const reasoningTokens = usage.reasoning_tokens || 0;

      outputCost +=
        (outputTokens / 1_000_000) * outputPrice + (reasoningTokens / 1_000_000) * reasoningPrice;
    }

    // 2. Image pricing (usually per image, but here we treat image_tokens as 'count' if small, or tokens if large)
    // RubyLLM v1.15 uses prices directly for images if provide details.
    if (pricing.images?.standard && usage.image_tokens) {
      const imagePrice = pricing.images.standard.input || 0;
      inputCost += usage.image_tokens * imagePrice;
    }

    const totalCost = inputCost + outputCost;

    return {
      ...usage,
      input_cost: Number(inputCost.toFixed(6)),
      output_cost: Number(outputCost.toFixed(6)),
      cost: Number(totalCost.toFixed(6))
    };
  }
}
