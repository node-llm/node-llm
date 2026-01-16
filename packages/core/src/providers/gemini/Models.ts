
import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { GeminiListModelsResponse } from "./types.js";


export class GeminiModels {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const { models } = (await response.json()) as GeminiListModelsResponse;

        return models.map((m) => {
          const modelId = m.name.replace("models/", "");
          const registryModel = ModelRegistry.find(modelId, "gemini");

          const info: ModelInfo = {
            id: modelId,
            name: registryModel?.name || m.displayName || modelId,
            provider: "gemini",
            family: registryModel?.family || modelId,
            context_window: registryModel?.context_window || Capabilities.getContextWindow(modelId),
            max_output_tokens:
              registryModel?.max_output_tokens || Capabilities.getMaxOutputTokens(modelId),
            modalities: registryModel?.modalities || Capabilities.getModalities(modelId),
            capabilities: Capabilities.getCapabilities(modelId),
            pricing: registryModel?.pricing || Capabilities.getPricing(modelId),
            metadata: {
              ...(registryModel?.metadata || {}),
              description: m.description,
              input_token_limit: m.inputTokenLimit,
              output_token_limit: m.outputTokenLimit,
              supported_generation_methods: m.supportedGenerationMethods
            }
          };

          return info;
        });
      }
    } catch (_error) {
      // Fallback
    }

    return ModelRegistry.all()
      .filter((m) => m.provider === "gemini")
      .map((m) => ({
        ...m,
        capabilities: Capabilities.getCapabilities(m.id)
      })) as ModelInfo[];
  }

  find(modelId: string) {
    return ModelRegistry.find(modelId, "gemini");
  }
}
