import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "anthropic") ?? 200_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "anthropic") ?? 8_192;
  }

  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "anthropic");
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "anthropic") ||
      ModelRegistry.supports(modelId, "function_calling", "anthropic")
    );
  }

  static supportsJsonMode(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "json_mode", "anthropic") || this.supportsTools(modelId);
  }

  static supportsExtendedThinking(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "anthropic");
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static getCapabilities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.capabilities) {
      const caps = [...model.capabilities];
      if (!caps.includes("streaming")) caps.push("streaming");
      return caps;
    }

    const caps = ["streaming"];
    if (this.supportsTools(modelId)) caps.push("function_calling");
    if (this.supportsExtendedThinking(modelId)) caps.push("reasoning");
    if (this.supportsJsonMode(modelId)) caps.push("json_mode");

    return caps;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "anthropic");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "anthropic");
  }
}
