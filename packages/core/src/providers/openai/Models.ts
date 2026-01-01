import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";

export class OpenAIModels {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(buildUrl(this.baseUrl, '/models'), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { data } = await response.json() as { data: any[] };
        
        return data.map(m => {
          const modelId = m.id;
          const registryModel = ModelRegistry.find(modelId, "openai");
          
          const info: ModelInfo = {
            id: modelId,
            name: registryModel?.name || Capabilities.formatDisplayName(modelId),
            provider: "openai",
            family: registryModel?.family || modelId,
            context_window: registryModel?.context_window || Capabilities.getContextWindow(modelId),
            max_output_tokens: registryModel?.max_output_tokens || Capabilities.getMaxOutputTokens(modelId),
            modalities: registryModel?.modalities || Capabilities.getModalities(modelId),
            capabilities: Capabilities.getCapabilities(modelId),
            pricing: registryModel?.pricing || Capabilities.getPricing(modelId),
            metadata: {
              ...(registryModel?.metadata || {}),
              created: m.created,
              owned_by: m.owned_by
            }
          };
          
          return info;
        });
      }
    } catch (_error) {
      // Fallback to registry if API call fails (e.g. in tests without network)
    }

    // Fallback to registry data
    return ModelRegistry.all()
      .filter(m => m.provider === "openai")
      .map(m => ({
          ...m,
          capabilities: Capabilities.getCapabilities(m.id)
      })) as unknown as ModelInfo[]; 
  }

  find(modelId: string) {
    return ModelRegistry.find(modelId, "openai");
  }
}
