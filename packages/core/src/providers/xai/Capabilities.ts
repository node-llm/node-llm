import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "xai");
  }

  static supportsTools(modelId: string): boolean {
    if (this.supportsImageGeneration(modelId)) return false;
    return (
      ModelRegistry.supports(modelId, "tools", "xai") ||
      ModelRegistry.supports(modelId, "function_calling", "xai") ||
      !modelId.includes("image")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    if (this.supportsImageGeneration(modelId)) return false;
    return (
      ModelRegistry.supports(modelId, "structured_output", "xai") || !modelId.includes("image")
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "embeddings", "xai");
  }

  static supportsImageGeneration(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "image_generation", "xai") ||
      modelId.includes("image") ||
      modelId.includes("imagine")
    );
  }

  static supportsTranscription(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "transcription", "xai");
  }

  static supportsModeration(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "moderation", "xai");
  }

  static supportsReasoning(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "xai") || modelId.includes("reasoning");
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static getContextWindow(modelId: string): number {
    return ModelRegistry.getContextWindow(modelId, "xai") ?? 128_000;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "xai");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "xai");
  }
}
