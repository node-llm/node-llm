const VISION_MODELS = [
  "grok-2-vision-1212",
  "grok-4-0709",
  "grok-4-fast-non-reasoning",
  "grok-4-fast-reasoning",
  "grok-4.1-fast-non-reasoning",
  "grok-4.1-fast-reasoning",
  "grok-4-1-fast-non-reasoning",
  "grok-4-1-fast-reasoning"
];

const REASONING_MODELS = [
  "grok-3-mini",
  "grok-4-0709",
  "grok-4-fast-reasoning",
  "grok-4.1-fast-reasoning",
  "grok-4-1-fast-reasoning",
  "grok-code-fast-1"
];

export class Capabilities {
  static supportsVision(model: string): boolean {
    return model.includes("vision") || VISION_MODELS.includes(model);
  }

  static supportsTools(model: string): boolean {
    if (this.supportsImageGeneration(model)) return false;
    return true;
  }

  static supportsStructuredOutput(model: string): boolean {
    if (this.supportsImageGeneration(model)) return false;
    return true;
  }

  static supportsEmbeddings(_model: string): boolean {
    return false;
  }

  static supportsImageGeneration(model: string): boolean {
    return model.includes("image") || model.includes("imagine");
  }

  static supportsTranscription(_model: string): boolean {
    return false;
  }

  static supportsModeration(_model: string): boolean {
    return false;
  }

  static supportsReasoning(model: string): boolean {
    return model.includes("reasoning") || REASONING_MODELS.includes(model);
  }

  static getContextWindow(_model: string): number {
    return 128000;
  }
}
