import { ModelRegistry } from "../../models/ModelRegistry.js";

export class OllamaCapabilities {
  static findModel(modelId: string) {
    // Ollama specific: try exact match first, then strip tags
    let model = ModelRegistry.find(modelId, "ollama");
    if (!model && modelId?.includes(":")) {
      const baseId = modelId.split(":")[0];
      if (baseId) {
        model = ModelRegistry.find(baseId, "ollama");
      }
    }
    return model;
  }

  static getContextWindow(modelId: string): number | null {
    const model = this.findModel(modelId);
    return model?.context_window || 8192;
  }

  static supportsVision(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.input?.includes("image") || model?.capabilities?.includes("vision") || false;
  }

  static supportsTools(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.capabilities?.includes("tools") || false;
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.capabilities?.includes("structured_output") || false;
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") || model?.capabilities?.includes("embeddings") || false;
  }

  static supportsReasoning(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.capabilities?.includes("reasoning") || false;
  }

  static supportsImageGeneration(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("image") || false;
  }

  static supportsTranscription(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.input?.includes("audio") || false;
  }

  static supportsModeration(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("moderation") || false;
  }
}
