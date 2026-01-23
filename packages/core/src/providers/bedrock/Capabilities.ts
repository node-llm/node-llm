/**
 * Bedrock Model Capabilities
 *
 * Maps Bedrock model IDs to their capabilities.
 * Supports Claude, DeepSeek, Titan, Mistral, and Llama models.
 */

import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Model Family Patterns
// ─────────────────────────────────────────────────────────────────────────────

type ModelFamily =
  | "claude3_opus"
  | "claude3_sonnet"
  | "claude3_haiku"
  | "claude3_5_haiku"
  | "claude2"
  | "claude_instant"
  | "other";

const MODEL_FAMILIES: Array<[RegExp, ModelFamily]> = [
  [/anthropic\.claude-3-opus/, "claude3_opus"],
  [/anthropic\.claude-3-sonnet/, "claude3_sonnet"],
  [/anthropic\.claude-3-5-sonnet/, "claude3_sonnet"],
  [/anthropic\.claude-3-7-sonnet/, "claude3_sonnet"],
  [/anthropic\.claude-3-haiku/, "claude3_haiku"],
  [/anthropic\.claude-3-5-haiku/, "claude3_5_haiku"],
  [/anthropic\.claude-v2/, "claude2"],
  [/anthropic\.claude-2/, "claude2"],
  [/anthropic\.claude-instant/, "claude_instant"]
];

// ─────────────────────────────────────────────────────────────────────────────
// Pricing (per million tokens)
// ─────────────────────────────────────────────────────────────────────────────

const PRICES: Record<ModelFamily, { input: number; output: number }> = {
  claude3_opus: { input: 15.0, output: 75.0 },
  claude3_sonnet: { input: 3.0, output: 15.0 },
  claude3_haiku: { input: 0.25, output: 1.25 },
  claude3_5_haiku: { input: 0.8, output: 4.0 },
  claude2: { input: 8.0, output: 24.0 },
  claude_instant: { input: 0.8, output: 2.4 },
  other: { input: 0.1, output: 0.2 }
};

// ─────────────────────────────────────────────────────────────────────────────
// Capabilities Class
// ─────────────────────────────────────────────────────────────────────────────

export class Capabilities {
  /**
   * Get the model family for pricing/capability lookup.
   */
  static getModelFamily(modelId: string): ModelFamily {
    for (const [pattern, family] of MODEL_FAMILIES) {
      if (pattern.test(modelId)) return family;
    }
    return "other";
  }

  /**
   * Get the context window for a model.
   */
  static getContextWindow(modelId: string): number | null {
    const val = ModelRegistry.getContextWindow(modelId, "bedrock");
    if (val) return val;

    // Claude 2 has 100k, others have 200k
    if (/anthropic\.claude-2/.test(modelId)) return 100_000;
    if (/anthropic\.claude/.test(modelId)) return 200_000;

    // DeepSeek
    if (/deepseek/.test(modelId)) return 128_000;

    // Mistral
    if (/mistral-large/.test(modelId)) return 128_000;
    if (/mistral/.test(modelId)) return 32_000;

    // Llama
    if (/llama/.test(modelId)) return 128_000;

    // Titan
    if (/titan/.test(modelId)) return 32_000;

    return null;
  }

  /**
   * Get max output tokens for a model.
   */
  static getMaxOutputTokens(modelId: string): number | null {
    const val = ModelRegistry.getMaxOutputTokens(modelId, "bedrock");
    if (val) return val;

    return 4_096;
  }

  /**
   * Check if a model supports chat.
   */
  static supportsChat(modelId: string): boolean {
    return /anthropic\.claude/.test(modelId);
  }

  /**
   * Check if a model supports streaming.
   */
  static supportsStreaming(modelId: string): boolean {
    return /anthropic\.claude/.test(modelId);
  }

  /**
   * Check if a model supports vision (image input).
   */
  static supportsVision(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "bedrock");
    if (model?.modalities?.input?.includes("image")) return true;

    // All Claude models support vision
    return /anthropic\.claude/.test(modelId);
  }

  /**
   * Check if a model supports tool/function calling.
   */
  static supportsTools(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "bedrock");
    if (model?.capabilities?.includes("function_calling")) return true;

    // Claude models support tools
    return /anthropic\.claude/.test(modelId);
  }

  /**
   * Check if a model supports JSON mode.
   */
  static supportsJsonMode(modelId: string): boolean {
    return /anthropic\.claude/.test(modelId);
  }

  /**
   * Check if a model supports extended thinking/reasoning.
   */
  static supportsExtendedThinking(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "bedrock");
    if (model?.capabilities?.includes("reasoning")) return true;

    // Claude 3.7 models support reasoning
    return /claude-3-7/.test(modelId);
  }

  /**
   * Check if a model supports audio input.
   */
  static supportsAudio(_modelId: string): boolean {
    return false;
  }

  /**
   * Get input modalities for a model.
   */
  static getInputModalities(modelId: string): string[] {
    const modalities = ["text"];

    if (/anthropic\.claude/.test(modelId) && this.supportsVision(modelId)) {
      modalities.push("image");
      modalities.push("pdf");
    }

    return modalities;
  }

  /**
   * Get output modalities for a model.
   */
  static getOutputModalities(_modelId: string): string[] {
    return ["text"];
  }

  /**
   * Get all capabilities for a model.
   */
  static getCapabilities(modelId: string): string[] {
    const capabilities: string[] = [];

    if (/anthropic\.claude/.test(modelId)) {
      capabilities.push("streaming");
    }

    if (this.supportsTools(modelId)) {
      capabilities.push("function_calling");
    }

    if (/claude-3-7/.test(modelId)) {
      capabilities.push("reasoning");
    }

    if (/claude-3\.5|claude-3-7/.test(modelId)) {
      capabilities.push("batch");
      capabilities.push("citations");
    }

    return capabilities;
  }

  /**
   * Get pricing for a model.
   */
  static getPricing(modelId: string): ModelPricing | undefined {
    // Try registry first
    const registryPricing = PricingRegistry.getPricing(modelId, "bedrock");
    if (registryPricing) return registryPricing;

    // Fallback to built-in pricing
    const family = this.getModelFamily(modelId);
    const prices = PRICES[family];

    return {
      text_tokens: {
        standard: {
          input_per_million: prices.input,
          output_per_million: prices.output
        },
        batch: {
          input_per_million: prices.input * 0.5,
          output_per_million: prices.output * 0.5
        }
      }
    };
  }

  /**
   * Get input price per million tokens.
   */
  static getInputPrice(modelId: string): number {
    const family = this.getModelFamily(modelId);
    return PRICES[family].input;
  }

  /**
   * Get output price per million tokens.
   */
  static getOutputPrice(modelId: string): number {
    const family = this.getModelFamily(modelId);
    return PRICES[family].output;
  }

  /**
   * Format model ID as display name.
   */
  static formatDisplayName(modelId: string): string {
    return modelId
      .replace(/-/g, " ")
      .split(".")
      .pop()!
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
