import { ModelRegistry } from "../../models/ModelRegistry.js";

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
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("vision")) return true;

    return model.includes("vision") || VISION_MODELS.includes(model);
  }

  static supportsTools(model: string): boolean {
    if (this.supportsImageGeneration(model)) return false;

    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("tools")) return true;

    return true;
  }

  static supportsStructuredOutput(model: string): boolean {
    if (this.supportsImageGeneration(model)) return false;

    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("structured_output")) return true;

    return true;
  }

  static supportsEmbeddings(model: string): boolean {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("embeddings")) return true;

    return false;
  }

  static supportsImageGeneration(model: string): boolean {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("image_generation")) return true;

    return model.includes("image") || model.includes("imagine");
  }

  static supportsTranscription(model: string): boolean {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("transcription")) return true;

    return false;
  }

  static supportsModeration(model: string): boolean {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("moderation")) return true;

    return false;
  }

  static supportsReasoning(model: string): boolean {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.capabilities.includes("reasoning")) return true;

    return model.includes("reasoning") || REASONING_MODELS.includes(model);
  }

  static getContextWindow(model: string): number {
    const registryModel = ModelRegistry.find(model, "xai");
    if (registryModel?.context_window) return registryModel.context_window;

    return 128000;
  }
}
