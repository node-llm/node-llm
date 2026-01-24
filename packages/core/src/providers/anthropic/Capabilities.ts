import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    const val = ModelRegistry.getContextWindow(modelId, "anthropic");
    return val ?? 200_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    const val = ModelRegistry.getMaxOutputTokens(modelId, "anthropic");
    return val ?? 4_096;
  }

  static supportsVision(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.modalities?.input?.includes("image")) return true;

    return /claude-3/.test(modelId);
  }

  static supportsTools(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("function_calling")) return true;

    return /claude-3/.test(modelId);
  }

  static supportsJsonMode(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities.includes("json_mode")) return true;

    return this.supportsTools(modelId);
  }

  static supportsExtendedThinking(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities.includes("reasoning")) return true;

    return /claude-3-7/.test(modelId) || /thinking/.test(modelId);
  }

  static getCapabilities(modelId: string): string[] {
    const caps = ["streaming"];
    const model = this.findModel(modelId);

    if (model) {
      if (model.capabilities.includes("function_calling")) caps.push("function_calling");
      if (model.capabilities.includes("reasoning")) caps.push("reasoning");
      if (model.capabilities.includes("json_mode")) caps.push("json_mode");
      model.capabilities.forEach((c) => {
        if (!caps.includes(c)) caps.push(c);
      });
      return caps;
    }

    if (this.supportsTools(modelId)) caps.push("function_calling");
    if (this.supportsExtendedThinking(modelId)) caps.push("reasoning");
    if (this.supportsJsonMode(modelId)) caps.push("json_mode");
    if (/claude-3/.test(modelId)) caps.push("batch");

    return caps;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "anthropic");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "anthropic");
  }
}
