import { Model } from "./types.js";
import { modelsData } from "./models.js";

export class ModelRegistry {
    private static models: Model[] = modelsData as unknown as Model[];

    static find(modelId: string, provider?: string): Model | undefined {
        return this.models.find(m => 
            (m.id === modelId || m.family === modelId) && (!provider || m.provider === provider)
        );
    }

    /**
     * Add or update models in the registry.
     */
    static save(models: Model | Model[]): void {
        const toAdd = Array.isArray(models) ? models : [models];
        
        toAdd.forEach(newModel => {
            const index = this.models.findIndex(m => m.id === newModel.id && m.provider === newModel.provider);
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
        return model?.capabilities.includes(capability) ?? false;
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
    static calculateCost(usage: { input_tokens: number; output_tokens: number; total_tokens: number; cached_tokens?: number; reasoning_tokens?: number }, modelId: string, provider: string) {
        const model = this.find(modelId, provider);
        if (!model || !model.pricing?.text_tokens?.standard) {
            return usage;
        }

        const prices = model.pricing.text_tokens.standard;
        const inputPrice = prices.input_per_million || 0;
        const outputPrice = prices.output_per_million || 0;
        const reasoningPrice = prices.reasoning_output_per_million || outputPrice;

        const cachedPrice = prices.cached_input_per_million ?? (inputPrice / 2);

        const inputCost = ((usage.input_tokens - (usage.cached_tokens || 0)) / 1_000_000) * inputPrice +
                          ((usage.cached_tokens || 0) / 1_000_000) * cachedPrice;
        
        const outputTokens = usage.output_tokens - (usage.reasoning_tokens || 0);
        const reasoningTokens = usage.reasoning_tokens || 0;

        const outputCost = (outputTokens / 1_000_000) * outputPrice +
                           (reasoningTokens / 1_000_000) * reasoningPrice;

        const totalCost = inputCost + outputCost;

        return {
            ...usage,
            input_cost: Number(inputCost.toFixed(6)),
            output_cost: Number(outputCost.toFixed(6)),
            cost: Number(totalCost.toFixed(6))
        };
    }
}
