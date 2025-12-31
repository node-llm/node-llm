import { ModelInfo } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { GeminiListModelsResponse } from "./types.js";

export class GeminiModels {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(): Promise<ModelInfo[]> {
    const url = `${this.baseUrl}/models?key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini error (${response.status}): ${errorText}`);
    }

    const json = (await response.json()) as GeminiListModelsResponse;
    
    return json.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map((model: any) => {
        const id = model.name.replace("models/", "");
        return {
          id: id,
          name: model.displayName || Capabilities.formatDisplayName(id),
          provider: "gemini",
          family: Capabilities.getFamily(id),
          context_window: model.inputTokenLimit || Capabilities.getContextWindow(id),
          max_output_tokens: model.outputTokenLimit || Capabilities.getMaxOutputTokens(id),
          modalities: Capabilities.getModalities(id),
          capabilities: Capabilities.getCapabilities(id),
          pricing: Capabilities.getPricing(id),
          metadata: {
            description: model.description,
            version: model.version,
          },
        };
      });
  }
}
