import { OpenAIModels } from "../openai/Models.js";
import { OllamaCapabilities } from "./Capabilities.js";


export class OllamaModels extends OpenAIModels {
  protected override getProviderName(): string {
    return "ollama";
  }

  protected override formatDisplayName(modelId: string): string {
    const model = OllamaCapabilities.findModel(modelId);
    if (model?.name && model.name !== modelId) return model.name;
    const baseId = modelId.split(":")[0] || modelId;
    return baseId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected override getContextWindow(modelId: string): number | null {
    return OllamaCapabilities.getContextWindow(modelId);
  }

  protected override getCapabilities(modelId: string): string[] {
    const model = OllamaCapabilities.findModel(modelId);
    if (model) return model.capabilities;

    // Fallback for custom pulled models
    const caps = ["streaming"];
    if (OllamaCapabilities.supportsTools(modelId)) caps.push("tools");
    if (OllamaCapabilities.supportsVision(modelId)) caps.push("vision");
    if (OllamaCapabilities.supportsEmbeddings(modelId)) caps.push("embeddings");
    return caps;
  }
}
