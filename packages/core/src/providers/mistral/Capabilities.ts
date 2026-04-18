import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class MistralCapabilities {
  static getCapabilities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.capabilities) {
      const caps = [...model.capabilities];
      if (!caps.includes("streaming")) caps.push("streaming");
      return caps;
    }

    const caps = ["streaming", "chat"];
    if (this.supportsTools(modelId)) caps.push("function_calling");
    if (this.supportsReasoning(modelId)) caps.push("reasoning");
    if (this.supportsVision(modelId)) caps.push("vision");
    if (this.supportsStructuredOutput(modelId)) caps.push("structured_output");

    return caps;
  }

  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "mistral") ?? 32_768;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "mistral") ?? 8_192;
  }

  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "mistral") || modelId.includes("pixtral");
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "mistral") ||
      ModelRegistry.supports(modelId, "function_calling", "mistral") ||
      !modelId.includes("embed")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "structured_output", "mistral") ||
      ModelRegistry.supports(modelId, "json_mode", "mistral") ||
      !modelId.includes("embed")
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") ?? modelId.includes("embed");
  }

  static supportsImageGeneration(_modelId: string): boolean {
    return false;
  }

  static supportsTranscription(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "transcription", "mistral") || modelId.includes("voxtral")
    );
  }

  static supportsModeration(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "moderation", "mistral") || modelId.includes("moderation")
    );
  }

  static supportsReasoning(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "mistral") || modelId.includes("magistral");
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "mistral");
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "mistral");
  }

  static getInputModalities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.modalities?.input) return model.modalities.input;

    const input = ["text"];
    if (this.supportsVision(modelId)) input.push("image");
    return input;
  }

  static getOutputModalities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.modalities?.output) return model.modalities.output;

    if (this.supportsEmbeddings(modelId)) return ["embeddings"];
    return ["text"];
  }
}
