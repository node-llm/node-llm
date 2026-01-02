import { ModelRegistry } from "../../models/ModelRegistry.js";

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
        return 64_000;
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
    return false;
  }

  static supportsTools(modelId: string): boolean {
    return /deepseek-chat/.test(modelId);
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return /deepseek-(?:chat|reasoner)/.test(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    return false;
  }

  static supportsImageGeneration(modelId: string): boolean {
    return false;
  }

  static supportsTranscription(modelId: string): boolean {
    return false;
  }

  static supportsModeration(modelId: string): boolean {
    return false;
  }

  static supportsReasoning(modelId: string): boolean {
    return /deepseek-reasoner/.test(modelId);
  }
}
