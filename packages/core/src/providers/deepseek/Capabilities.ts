import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getCapabilities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.capabilities) {
      const caps = [...model.capabilities];
      if (!caps.includes("streaming")) caps.push("streaming");
      return caps;
    }

    const caps = ["streaming"];
    if (this.supportsTools(modelId)) caps.push("function_calling");
    if (this.supportsReasoning(modelId)) caps.push("reasoning");

    return caps;
  }

  static getContextWindow(modelId: string): number {
    return ModelRegistry.getContextWindow(modelId, "deepseek") ?? 32_768;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "deepseek") ?? 8_192;
  }

  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "deepseek");
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "deepseek") ||
      ModelRegistry.supports(modelId, "function_calling", "deepseek") ||
      modelId.includes("chat")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "structured_output", "deepseek") || modelId.includes("chat")
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") ?? false;
  }

  static supportsImageGeneration(_modelId: string): boolean {
    return false;
  }

  static supportsTranscription(_modelId: string): boolean {
    return false;
  }

  static supportsModeration(_modelId: string): boolean {
    return false;
  }

  static supportsReasoning(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "deepseek") || modelId.includes("reasoner");
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "deepseek");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "deepseek");
  }
}
