import { ModelInfo } from "../Provider.js";
import { MistralCapabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

interface MistralModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

interface MistralModelListResponse {
  object: "list";
  data: MistralModel[];
}

export class MistralModels {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      // Fallback to local registry
      const localModels = ModelRegistry.all()
        .filter((m) => m.provider === "mistral")
        .map((m) => ({
          id: m.id,
          name: m.name,
          provider: "mistral",
          family: m.family ?? "mistral",
          context_window: m.context_window ?? null,
          max_output_tokens: m.max_output_tokens ?? null,
          modalities: m.modalities,
          capabilities: m.capabilities,
          pricing: m.pricing,
          metadata: m.metadata
        }));

      return localModels;
    }

    const json = (await response.json()) as MistralModelListResponse;
    const localRegistry = ModelRegistry.all().filter((m) => m.provider === "mistral");

    return json.data.map((m) => {
      // Try to find in local registry for enriched data (pricing, limits)
      const local = localRegistry.find((l) => l.id === m.id);

      if (local) {
        return {
          id: local.id,
          name: local.name,
          provider: "mistral",
          family: local.family ?? "mistral",
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
        provider: "mistral",
        family: "mistral",
        context_window: MistralCapabilities.getContextWindow(m.id),
        max_output_tokens: MistralCapabilities.getMaxOutputTokens(m.id),
        modalities: {
          input: MistralCapabilities.getInputModalities(m.id),
          output: MistralCapabilities.getOutputModalities(m.id)
        },
        capabilities: MistralCapabilities.getCapabilities(m.id),
        pricing: MistralCapabilities.getPricing(m.id)
      };
    });
  }
}
