import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

interface DeepSeekModel {
  id: string;
  object: "model";
  owned_by: string;
}

interface DeepSeekModelListResponse {
  object: "list";
  data: DeepSeekModel[];
}

export class DeepSeekModels {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
        // Fallback to local registry
        const localModels = ModelRegistry.all()
            .filter(m => m.provider === "deepseek")
            .map(m => ({
                id: m.id,
                name: m.name,
                provider: "deepseek",
                family: m.family ?? "deepseek",
                context_window: m.context_window ?? null,
                max_output_tokens: m.max_output_tokens ?? null,
                modalities: m.modalities,
                capabilities: m.capabilities,
                pricing: m.pricing,
                metadata: m.metadata
            }));

        return localModels;
    }

    const json = (await response.json()) as DeepSeekModelListResponse;
    const localRegistry = ModelRegistry.all().filter(m => m.provider === "deepseek");
    
    return json.data.map(m => {
        // Try to find in local registry for enriched data (pricing, limits)
        const local = localRegistry.find(l => l.id === m.id);
        
        if (local) {
             return {
                id: local.id,
                name: local.name,
                provider: "deepseek", // Ensure literal type
                family: local.family ?? "deepseek", // Handle missing family
                context_window: local.context_window ?? null,
                max_output_tokens: local.max_output_tokens ?? null,
                modalities: local.modalities,
                capabilities: local.capabilities,
                pricing: local.pricing,
                metadata: local.metadata
             };
        }

        return {
            id: m.id,
            name: m.id,
            provider: "deepseek",
            family: "deepseek",
            context_window: Capabilities.getContextWindow(m.id),
            max_output_tokens: Capabilities.getMaxOutputTokens(m.id),
            modalities: { input: ["text"], output: ["text"] },
            capabilities: Capabilities.getCapabilities(m.id),
            pricing: {}
        };
    });
  }
}
