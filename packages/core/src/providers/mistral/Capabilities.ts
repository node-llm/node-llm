import { ModelRegistry } from "../../models/ModelRegistry.js";
import { PricingRegistry } from "../../models/PricingRegistry.js";
import { ModelPricing } from "../../models/types.js";

export class MistralCapabilities {
  static getCapabilities(modelId: string): string[] {
    const caps = ["streaming", "chat"];

    if (this.supportsTools(modelId)) {
      caps.push("function_calling", "tools");
    }

    if (this.supportsVision(modelId)) {
      caps.push("vision");
    }

    if (this.supportsStructuredOutput(modelId)) {
      caps.push("structured_output", "json_mode");
    }

    return caps;
  }

  static getContextWindow(modelId: string): number | null {
    const val = ModelRegistry.getContextWindow(modelId, "mistral");
    if (val) return val;

    // Mistral models typically have 32K-128K context
    if (/mistral-large|codestral/.test(modelId)) {
      return 128_000;
    }
    if (/mistral-medium|mistral-small|pixtral/.test(modelId)) {
      return 32_000;
    }
    return 32_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    const model = this.findModel(modelId);
    if (model?.max_output_tokens) return model.max_output_tokens;

    // Default max output for Mistral models
    return 8_192;
  }

  static supportsVision(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.modalities?.input?.includes("image")) return true;

    // Pixtral models support vision
    return /pixtral/.test(modelId.toLowerCase());
  }

  static supportsTools(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("function_calling") || model?.capabilities?.includes("tools"))
      return true;

    // Most Mistral models support tools except embedding models
    return !/embed/.test(modelId.toLowerCase());
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.capabilities?.includes("structured_output")) return true;

    // Most Mistral chat models support JSON mode
    return !/embed/.test(modelId.toLowerCase());
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = this.findModel(modelId);
    if (model?.modalities?.output?.includes("embeddings")) return true;

    return /embed/.test(modelId.toLowerCase());
  }

  static supportsImageGeneration(_modelId: string): boolean {
    return false;
  }

  static supportsTranscription(_modelId: string): boolean {
    return false;
  }

  static supportsModeration(modelId: string): boolean {
    const model = this.findModel(modelId);
    return model?.capabilities?.includes("moderation") || false;
  }

  static supportsReasoning(_modelId: string): boolean {
    // Mistral doesn't have dedicated reasoning models yet
    return false;
  }

  static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "mistral");
  }

  static getPricing(modelId: string): ModelPricing | undefined {
    const model = this.findModel(modelId);
    if (model?.pricing) return model.pricing;

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
