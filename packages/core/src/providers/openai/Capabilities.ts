import { OPENAI_MODELS, ModelFamilyDefinition } from "./ModelDefinitions.js";

export class Capabilities {
  static getFamily(modelId: string): string {
    for (const [key, def] of Object.entries(OPENAI_MODELS)) {
      if (key === "other") continue;
      if (def.pattern.test(modelId)) {
        return key;
      }
    }
    return "other";
  }

  static getDefinition(modelId: string): ModelFamilyDefinition {
    const family = this.getFamily(modelId);
    return OPENAI_MODELS[family]!;
  }

  static getContextWindow(modelId: string): number | null {
    return this.getDefinition(modelId).contextWindow;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    return this.getDefinition(modelId).maxOutputTokens;
  }

  static supportsVision(modelId: string): boolean {
    return !!this.getDefinition(modelId).features.vision;
  }

  static supportsTools(modelId: string): boolean {
    return !!this.getDefinition(modelId).features.tools;
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return !!this.getDefinition(modelId).features.structuredOutput;
  }

  static supportsJsonMode(modelId: string): boolean {
    return this.supportsStructuredOutput(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    return this.getDefinition(modelId).type === "embedding";
  }

  static getInputPrice(modelId: string): number {
    const prices = this.getDefinition(modelId).pricing;
    return prices.input || prices.price || 0.5;
  }

  static getCachedInputPrice(modelId: string): number | undefined {
    return this.getDefinition(modelId).pricing.cached_input;
  }

  static getOutputPrice(modelId: string): number {
    const prices = this.getDefinition(modelId).pricing;
    return prices.output || prices.price || 1.5;
  }

  static getModelType(modelId: string): "embedding" | "audio" | "moderation" | "image" | "chat" {
    return this.getDefinition(modelId).type;
  }

  static formatDisplayName(modelId: string): string {
    const humanized = modelId.replace(/-/g, " ").split(" ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    return this.applySpecialFormatting(humanized);
  }

  private static applySpecialFormatting(name: string): string {
    return name
      .replace(/(\d{4}) (\d{2}) (\d{2})/, "$1$2$3")
      .replace(/^(?:Gpt|Chatgpt|Tts|Dall E) /g, (m) => this.specialPrefixFormat(m.trim()))
      .replace(/^O([13]) /g, "O$1-")
      .replace(/^O[13] Mini/g, (m) => m.replace(" ", "-"))
      .replace(/\d\.\d /g, (m) => m.replace(" ", "-"))
      .replace(/4o (?=Mini|Preview|Turbo|Audio|Realtime|Transcribe|Tts)/g, "4o-")
      .replace(/\bHd\b/g, "HD")
      .replace(/(?:Omni|Text) Moderation/g, (m) => m.replace(" ", "-"))
      .replace("Text Embedding", "text-embedding-");
  }

  private static specialPrefixFormat(prefix: string): string {
    switch (prefix) {
      case "Gpt": return "GPT-";
      case "Chatgpt": return "ChatGPT-";
      case "Tts": return "TTS-";
      case "Dall E": return "DALL-E-";
      default: return prefix + "-";
    }
  }

  static normalizeTemperature(temperature: number | undefined, modelId: string): number | undefined | null {
    if (/^(o\d|gpt-5)/.test(modelId)) {
      return 1.0;
    }
    if (/-search/.test(modelId)) {
      return null;
    }
    return temperature;
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const type = this.getModelType(modelId);
    const features = this.getDefinition(modelId).features;

    const modalities = {
      input: ["text"],
      output: ["text"]
    };

    if (features.vision) modalities.input.push("image", "pdf");
    if (type === "audio") {
      modalities.input.push("audio");
      modalities.output.push("audio");
    }
    if (type === "image") modalities.output.push("image");
    if (type === "embedding") modalities.output.push("embeddings");
    if (type === "moderation") modalities.output.push("moderation");

    return modalities;
  }

  static getCapabilities(modelId: string): string[] {
    const capabilities: string[] = [];
    const type = this.getModelType(modelId);
    const features = this.getDefinition(modelId).features;

    if (type !== "moderation" && type !== "embedding") capabilities.push("streaming");
    if (features.tools) capabilities.push("function_calling");
    if (features.structuredOutput) capabilities.push("structured_output");
    if (type === "embedding") capabilities.push("batch");
    if (/o\d|gpt-5|codex/.test(modelId)) capabilities.push("reasoning");

    if (type === "image") capabilities.push("image_generation");
    if (type === "audio") capabilities.push("speech_generation", "transcription");

    return capabilities;
  }

  static getPricing(modelId: string) {
    const standardPricing = {
      input_per_million: this.getInputPrice(modelId),
      output_per_million: this.getOutputPrice(modelId)
    };

    const cachedPrice = this.getCachedInputPrice(modelId);
    const pricing: any = { 
      text_tokens: { 
        standard: {
          ...standardPricing,
          ...(cachedPrice ? { cached_input_per_million: cachedPrice } : {})
        } 
      } 
    };

    if (this.getModelType(modelId) === "embedding") {
      pricing.text_tokens.batch = {
        input_per_million: standardPricing.input_per_million * 0.5,
        output_per_million: standardPricing.output_per_million * 0.5
      };
    }

    return pricing;
  }
}
