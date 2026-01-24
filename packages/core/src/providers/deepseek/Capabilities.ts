import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getCapabilities(modelId: string): string[] {
    const caps = ["streaming"];

    if (/deepseek-chat/.test(modelId)) {
      caps.push("function_calling");
    }

    if (/deepseek-reasoner/.test(modelId)) {
      caps.push("reasoning");
    }

    return caps;
  }

  static getContextWindow(modelId: string): number | null {
    const val = ModelRegistry.getContextWindow(modelId, "deepseek");
    if (val) return val;

    if (/deepseek-(?:chat|reasoner)/.test(modelId)) {
      return 128_000;
    }
    return 32_768;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    if (/deepseek-(?:chat|reasoner)/.test(modelId)) {
      return 8_192;
    }
    return 4_096;
  }

  static supportsVision(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.input?.includes("image") || false;
  }

  static supportsTools(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("function_calling") || model?.capabilities?.includes("tools"))
      return true;

    return /deepseek-chat/.test(modelId);
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("structured_output")) return true;

    return /deepseek-(?:chat|reasoner)/.test(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") || false;
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
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("reasoning")) return true;

    return /deepseek-reasoner/.test(modelId);
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "deepseek");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "deepseek");
  }
}
