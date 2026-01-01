import { ModelInfo } from "../Provider.js";
import { Capabilities, ANTHROPIC_MODELS } from "./Capabilities.js";

export class AnthropicModels {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.data || [];

      return models.map((model: any) => {
        const id = model.id;
        const createdAt = new Date(model.created_at);

        return {
          id: id,
          name: model.display_name || id,
          provider: "anthropic",
          family: Capabilities.getFamily(id),
          context_window: Capabilities.getContextWindow(id),
          max_output_tokens: Capabilities.getMaxOutputTokens(id),
          modalities: Capabilities.getModalities(id),
          capabilities: Capabilities.getCapabilities(id),
          pricing: Capabilities.getPricing(id),
          created_at: createdAt
        };
      });
    } catch (error) {
       // Fallback to currently defined static models if API list fails
       return Object.entries(ANTHROPIC_MODELS).filter(([key]) => key !== "other").map(([key, def]) => {
        let id = key.replace(/_/g, "-");
        if (id.includes("claude-3-5")) id = "claude-3-5-sonnet-20240620";
        else if (id.includes("claude-3-haiku")) id = "claude-3-haiku-20240307";

        return {
          id: id,
          name: id,
          provider: "anthropic",
          family: Capabilities.getFamily(id),
          context_window: def.contextWindow,
          max_output_tokens: def.maxOutputTokens,
          modalities: Capabilities.getModalities(id),
          capabilities: Capabilities.getCapabilities(id),
          pricing: Capabilities.getPricing(id)
        };
      });
    }
  }
}
