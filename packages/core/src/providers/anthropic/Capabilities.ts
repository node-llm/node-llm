import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static supportsTemperature(modelId: string): boolean {
    return ModelRegistry.supportsTemperature(modelId, "anthropic");
  }

  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "anthropic") ?? 200_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "anthropic") ?? 8_192;
  }

  /**
   * Whether the model takes `defer_loading` tools and `tool_reference` results
   * (tool search). Claude 4.5 and later; not Claude 3, Opus 4 / 4.1 or Sonnet 4.
   */
  static supportsToolSearch(modelId: string): boolean {
    const id = modelId.replace(/^(?:[a-z]{2,4}\.)?anthropic\./, "");
    if (!id.startsWith("claude-")) return false;
    if (/^claude-(?:\d|instant)/.test(id) || /^claude-3/.test(id)) return false;
    if (/^claude-(?:opus|sonnet)-4(?:-[01])?(?:-\d{8}|@\d{8}|$|-latest|-v\d)/.test(id))
      return false;
    return true;
  }

  /**
   * Whether the model takes `output_config.format`, which makes its answer match a JSON schema.
   * Fable and Mythos 5, Opus 5 and 4.8, Sonnet 5, Haiku 5 and 4.5, and the older Opus 4.5 and 4.1.
   */
  static supportsStructuredOutputs(modelId: string): boolean {
    const id = modelId.replace(/^(?:[a-z]{2,4}\.)?anthropic\./, "");
    return /^claude-(?:(?:fable|mythos|opus|sonnet|haiku)-5|opus-4-[158]|haiku-4-5)(?:\b|-|@|$)/.test(
      id
    );
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
