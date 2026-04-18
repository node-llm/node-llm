import { ModelRegistry } from "../../models/ModelRegistry.js";

export class OpenRouterCapabilities {
  private static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "openrouter");
  }

  static supportsVision(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "vision", "openrouter") ||
      /vision|gpt-4o|claude-3|gemini|flash/.test(modelId.toLowerCase())
    );
  }

  static supportsTools(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "tools", "openrouter") ||
      ModelRegistry.supports(modelId, "function_calling", "openrouter") ||
      true
    ); // OpenRouter usually supports tools on most modern models
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "structured_output", "openrouter") ||
      /gpt-4|gpt-3\.5|claude-3/.test(modelId.toLowerCase())
    );
  }

  static supportsEmbeddings(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "embeddings", "openrouter") || modelId.includes("embedding")
    );
  }

  static supportsImageGeneration(_modelId: string): boolean {
    return false;
  }

  static supportsTranscription(_modelId: string): boolean {
    return false;
  }

  static supportsModeration(_modelId: string): boolean {
    return false;
  }

  static supportsReasoning(modelId: string): boolean {
    return (
      ModelRegistry.supports(modelId, "reasoning", "openrouter") ||
      /o1-|o3-|reasoner|-r1|qwq/.test(modelId.toLowerCase())
    );
  }

  static supportsToolChoice(_modelId: string): boolean {
    return true;
  }

  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "openrouter") ?? null;
  }
}
