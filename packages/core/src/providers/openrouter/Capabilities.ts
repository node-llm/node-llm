import { ModelRegistry } from "../../models/ModelRegistry.js";

export class OpenRouterCapabilities {
  private static findModel(model: string) {
    return ModelRegistry.find(model, "openrouter");
  }

  static supportsVision(model: string): boolean {
    const info = this.findModel(model);
    if (info)
      return info.capabilities.includes("vision") || info.modalities.input.includes("image");

    // Fallback heuristics
    return (
      model.includes("vision") ||
      model.includes("gpt-4o") ||
      model.includes("claude-3") ||
      model.includes("gemini-1.5") ||
      model.includes("gemini-2.0") ||
      model.includes("flash") ||
      model.includes("gemini-pro-vision")
    );
  }

  static supportsTools(model: string): boolean {
    const info = this.findModel(model);
    if (info)
      return info.capabilities.includes("tools") || info.capabilities.includes("function_calling");

    // Fallback: Default to true for OpenRouter as most models support tools
    // but this is the "honest" check we wanted.
    return true;
  }

  static supportsStructuredOutput(model: string): boolean {
    const info = this.findModel(model);
    if (info) return info.capabilities.includes("structured_output") || info.id.includes("gpt-4");

    // Fallback heuristics
    return model.includes("gpt-4") || model.includes("gpt-3.5") || model.includes("claude-3");
  }

  static supportsEmbeddings(model: string): boolean {
    const info = this.findModel(model);
    if (info) return info.capabilities.includes("embeddings");

    // Fallback heuristics
    return model.includes("embedding") || model.includes("text-sdk");
  }

  static supportsImageGeneration(_model: string): boolean {
    return false;
  }

  static supportsTranscription(_model: string): boolean {
    return false;
  }

  static supportsModeration(_model: string): boolean {
    return false;
  }

  static supportsReasoning(model: string): boolean {
    const info = this.findModel(model);
    if (info) return info.capabilities.includes("reasoning");

    // Fallback heuristics
    return (
      model.includes("o1") ||
      model.includes("o3") ||
      model.includes("deepseek-r1") ||
      model.includes("qwq")
    );
  }

  static getContextWindow(model: string): number | null {
    const info = this.findModel(model);
    return info?.context_window ?? null;
  }
}
