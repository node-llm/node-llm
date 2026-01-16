import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

export class AnthropicModels {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      });

      if (response.ok) {
        const { data } = (await response.json()) as {
          data: { id: string; display_name: string; created_at: string }[];
        };

        return data.map((m) => {
          const modelId = m.id;
          const registryModel = ModelRegistry.find(modelId, "anthropic");

          const info: ModelInfo = {
            id: modelId,
            name: registryModel?.name || m.display_name || modelId,
            provider: "anthropic",
            family: registryModel?.family || modelId,
            context_window: registryModel?.context_window || Capabilities.getContextWindow(modelId),
            max_output_tokens:
              registryModel?.max_output_tokens || Capabilities.getMaxOutputTokens(modelId),
            modalities: registryModel?.modalities || { input: ["text"], output: ["text"] },
            capabilities: Capabilities.getCapabilities(modelId),
            pricing: registryModel?.pricing || Capabilities.getPricing(modelId),
            metadata: {
              ...(registryModel?.metadata || {}),
              display_name: m.display_name,
              created_at: m.created_at
            }
          };

          return info;
        });
      }
    } catch (_error) {
      // Fallback
    }

    return ModelRegistry.all()
      .filter((m) => m.provider === "anthropic")
      .map((m) => ({
        ...m,
        capabilities: Capabilities.getCapabilities(m.id)
      })) as ModelInfo[];
  }

  find(modelId: string) {
    return ModelRegistry.find(modelId, "anthropic");
  }
}
