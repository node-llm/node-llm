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
    return model?.context_window || 32_768;
  }

  static supportsVision(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "vision", "ollama") ||
      modelId.includes("vision") ||
      modelId.includes("llava")
    );
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "ollama") ||
      ModelRegistry.supports(modelId, "function_calling", "ollama")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "structured_output", "ollama");
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") ?? modelId.includes("embed");
  }

  static supportsReasoning(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "reasoning", "ollama") ||
      modelId.includes("reason") ||
      modelId.includes("thought")
    );
  }

  static supportsImageGeneration(modelId: string): boolean {
    return false;
  }

  static supportsTranscription(modelId: string): boolean {
    return false;
  }

  static supportsModeration(modelId: string): boolean {
    return false;
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }
}
