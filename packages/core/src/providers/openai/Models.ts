import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { buildUrl } from "./utils.js";

export class OpenAIModels {
  constructor(
    protected readonly baseUrl: string,
    protected readonly apiKey: string
  ) {}

  protected getProviderName(): string {
    return "openai";
  }

  protected formatDisplayName(modelId: string): string {
    const model = ModelRegistry.find(modelId, this.getProviderName());
    if (model?.name && model.name !== modelId) return model.name;
    return Capabilities.formatDisplayName(modelId);
  }

  protected getContextWindow(modelId: string): number | null {
    return (
      ModelRegistry.getContextWindow(modelId, this.getProviderName()) ||
      Capabilities.getContextWindow(modelId) ||
      null
    );
  }

  protected getMaxOutputTokens(modelId: string): number | null {
    return (
      ModelRegistry.getMaxOutputTokens(modelId, this.getProviderName()) ||
      Capabilities.getMaxOutputTokens(modelId) ||
      null
    );
  }

  protected getModalities(modelId: string) {
    const model = ModelRegistry.find(modelId, this.getProviderName());
    return model?.modalities || Capabilities.getModalities(modelId);
  }

  protected getCapabilities(modelId: string): string[] {
    const model = ModelRegistry.find(modelId, this.getProviderName());
    return model?.capabilities || Capabilities.getCapabilities(modelId);
  }

  protected getPricing(modelId: string) {
    const model = ModelRegistry.find(modelId, this.getProviderName());
    return model?.pricing || Capabilities.getPricing(modelId);
  }

  async execute(): Promise<ModelInfo[]> {
    const provider = this.getProviderName();
    try {
      const response = await fetch(buildUrl(this.baseUrl, "/models"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const { data } = (await response.json()) as { data: { id: string; created: number; owned_by: string }[] };

        return data.map((m) => {
          const modelId = m.id;
          const registryModel = ModelRegistry.find(modelId, provider);

          return {
            id: modelId,
            name: this.formatDisplayName(modelId),
            provider: provider,
            family: registryModel?.family || modelId,
            context_window: this.getContextWindow(modelId),
            max_output_tokens: this.getMaxOutputTokens(modelId),
            modalities: this.getModalities(modelId),
            capabilities: this.getCapabilities(modelId),
            pricing: this.getPricing(modelId),
            metadata: {
              ...(registryModel?.metadata || {}),
              created: m.created,
              owned_by: m.owned_by
            }
          };
        });
      }
    } catch (_error) {
      // Fallback to registry if API call fails
    }

    // Fallback to registry data
    return ModelRegistry.all()
      .filter((m) => m.provider === provider)
      .map((m) => ({
        id: m.id,
        name: m.name,
        family: m.family || m.id,
        provider: provider,
        context_window: m.context_window ?? null,
        capabilities: m.capabilities,
        modalities: m.modalities,
        max_output_tokens: m.max_output_tokens ?? null,
        pricing: m.pricing || {}
      })) as ModelInfo[];
  }

  find(modelId: string) {
    return ModelRegistry.find(modelId, this.getProviderName());
  }
}
