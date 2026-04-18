import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "gemini") ?? 32_768;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "gemini") ?? 4_096;
  }

  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "gemini");
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "gemini") ||
      ModelRegistry.supports(modelId, "function_calling", "gemini")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "structured_output", "gemini");
  }

  static supportsSystemInstructions(_modelId: string): boolean {
    return true;
  }

  static supportsJsonMode(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "json_mode", "gemini") ||
      this.supportsStructuredOutput(modelId)
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") ?? modelId.includes("embedding");
  }

  static supportsImageGeneration(modelId: string): boolean {
    const model = this.findModel(modelId);
    return (
      model?.capabilities?.includes("image_generation") ||
      model?.modalities?.output?.includes("image") ||
      modelId.includes("imagen")
    );
  }

  static supportsTranscription(modelId: string): boolean {
    const model = this.findModel(modelId);
    return (
      model?.modalities?.input?.includes("audio") ?? modelId.match(/gemini|flash|pro/) !== null
    );
  }

  static supportsModeration(_modelId: string): boolean {
    return false;
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static normalizeTemperature(temperature: number | undefined, _model: string): number | undefined {
    return temperature;
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const model = this.findModel(modelId);
    if (model?.modalities) return model.modalities;

    const input = ["text"];
    const output = ["text"];

    if (this.supportsVision(modelId)) input.push("image", "video", "audio", "pdf");
    if (this.supportsImageGeneration(modelId)) output.push("image");
    if (this.supportsEmbeddings(modelId)) output.push("embeddings");

    return { input, output };
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
    if (this.supportsStructuredOutput(modelId)) caps.push("structured_output");
    if (this.supportsEmbeddings(modelId)) caps.push("embeddings");
    if (this.supportsImageGeneration(modelId)) caps.push("image_generation");
    return caps;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "gemini");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "gemini");
  }
}
