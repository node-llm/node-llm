export class Capabilities {
  static supportsVision(model: string): boolean {
    return model.includes("vision") || model.includes("v");
  }

  static supportsTools(model: string): boolean {
    // Most Grok models support tools
    return true;
  }

  static supportsStructuredOutput(model: string): boolean {
    // Grok supports structured output (json_object/json_schema) via OpenAI compatibility
    return true;
  }

  static supportsEmbeddings(_model: string): boolean {
    return false;
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
    // Currently Grok doesn't have a designated 'reasoning' model like o1/deepseek-r1
    // but they are capable. However, for filtering purposes:
    return model.includes("reasoning");
  }

  static getContextWindow(model: string): number {
    if (model.includes("grok-2")) return 128000;
    if (model.includes("grok-beta")) return 128000;
    return 128000; // Default for xAI models
  }
}
