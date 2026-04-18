/**
 * Maps Bedrock model IDs to their capabilities.
 */

import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Model Family Patterns
// ─────────────────────────────────────────────────────────────────────────────

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "bedrock") ?? 128_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return ModelRegistry.getMaxOutputTokens(modelId, "bedrock") ?? 4_096;
  }

  static supportsChat(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "chat", "bedrock") || !modelId.includes("titan-embed");
  }

  static supportsStreaming(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "streaming", "bedrock") || !modelId.includes("titan-embed")
    );
  }

  static supportsVision(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "vision", "bedrock") ||
      modelId.includes("vision") ||
      modelId.includes("nova")
    );
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "bedrock") ||
      ModelRegistry.supports(modelId, "function_calling", "bedrock")
    );
  }

  static supportsJsonMode(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "json_mode", "bedrock") ||
      ModelRegistry.supports(modelId, "structured_output", "bedrock")
    );
  }

  static supportsExtendedThinking(modelId: string): boolean {
    return ModelRegistry.supports(modelId, "reasoning", "bedrock");
  }

  static supportsEmbeddings(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "embeddings", "bedrock") || modelId.includes("titan-embed")
    );
  }

  static supportsImageGeneration(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "image_generation", "bedrock") ||
      modelId.includes("image-generator") ||
      modelId.includes("stable-diffusion")
    );
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static getInputModalities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.modalities?.input) return model.modalities.input;

    const modalities = ["text"];
    if (this.supportsVision(modelId)) {
      modalities.push("image", "pdf");
    }
    return modalities;
  }

  static getOutputModalities(modelId: string): string[] {
    const model = this.findModel(modelId);
    return model?.modalities?.output || ["text"];
  }

  static getCapabilities(modelId: string): string[] {
    const model = this.findModel(modelId);
    if (model?.capabilities) {
      const caps = [...model.capabilities];
      if (!caps.includes("streaming")) caps.push("streaming");
      return caps;
    }

    const capabilities: string[] = ["streaming"];
    if (this.supportsTools(modelId)) capabilities.push("function_calling");
    if (this.supportsExtendedThinking(modelId)) capabilities.push("reasoning");

    return capabilities;
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    return PricingRegistry.getPricing(modelId, "bedrock");
  }

  static getModelFamily(modelId: string): string {
    const model = this.findModel(modelId);
    if (model?.family) return model.family;

    if (modelId.includes("claude")) return "claude";
    if (modelId.includes("mistral")) return "mistral";
    if (modelId.includes("llama")) return "llama";
    if (modelId.includes("titan")) return "titan";
    if (modelId.includes("nova")) return "nova";
    if (modelId.includes("deepseek")) return "deepseek";
    return "other";
  }

  static formatDisplayName(modelId: string): string {
    const model = this.findModel(modelId);
    if (model?.name && model.name !== modelId) return model.name;

    return modelId
      .replace(/-/g, " ")
      .split(".")
      .pop()!
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "bedrock");
  }
}
