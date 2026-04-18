import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "openai") ?? 128_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "openai") ?? 4_096;
  }

  static supportsVision(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "vision", "openai");
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "openai") ||
      ModelRegistry.supports(modelId, "function_calling", "openai")
    );
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "structured_output", "openai");
  }

  static supportsJsonMode(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "json_mode", "openai") ||
      this.supportsStructuredOutput(modelId)
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("embeddings") ?? modelId.includes("embedding");
  }

  static supportsImageGeneration(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "image_generation", "openai") || modelId.includes("dall-e")
    );
  }

  static supportsTranscription(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.input?.includes("audio") ?? modelId.includes("whisper");
  }

  static supportsModeration(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.modalities?.output?.includes("moderation") ?? modelId.includes("moderation");
  }

  static supportsReasoning(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "openai");
  }

  static supportsDeveloperRole(modelId: string): boolean {
    return /gpt-4o|o1|o3|gpt-5/.test(modelId);
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static supportsPrediction(modelId: string): boolean {
    return /gpt-4o|gpt-4-/.test(modelId);
  }

  static needsMaxCompletionTokens(modelId: string): boolean {
    return this.supportsReasoning(modelId);
  }

  static getModelType(modelId: string): string {
    if (this.supportsEmbeddings(modelId)) return "embeddings";
    if (this.supportsModeration(modelId)) return "moderation";
    if (this.supportsImageGeneration(modelId)) return "image";
    if (this.supportsTranscription(modelId)) return "audio_transcription";
    if (modelId.includes("tts") || modelId.includes("speech")) return "audio_speech";
    if (modelId.includes("audio")) return "audio";
    return "chat";
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const model = this.findModel(modelId);
    if (model?.modalities) return model.modalities;

    const input = ["text"];
    const output = ["text"];

    if (this.supportsVision(modelId)) input.push("image", "pdf");
    if (this.supportsTranscription(modelId)) input.push("audio");
    if (this.supportsImageGeneration(modelId)) output.push("image");
    if (this.supportsEmbeddings(modelId)) output.push("embeddings");
    if (this.supportsModeration(modelId)) output.push("moderation");

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
    if (this.supportsReasoning(modelId)) caps.push("reasoning");
    if (this.supportsImageGeneration(modelId)) caps.push("image_generation");
    if (this.supportsTranscription(modelId)) caps.push("transcription");

    return caps;
  }

  static normalizeTemperature(
    temperature: number | undefined,
    modelId: string
  ): number | undefined | null {
    if (this.supportsReasoning(modelId)) return 1.0;
    if (modelId.includes("-search")) return null;
    return temperature;
  }

  static formatDisplayName(modelId: string): string {
    const model = this.findModel(modelId);
    if (model?.name && model.name !== modelId) return model.name;
    return modelId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "openai");
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "openai");
  }
}
