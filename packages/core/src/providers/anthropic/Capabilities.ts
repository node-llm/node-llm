export interface ModelPricing {
  input?: number;
  output?: number;
  cache_write?: number;
  cache_read?: number;
}

export interface ModelFeatures {
  vision?: boolean;
  tools?: boolean;
  jsonMode?: boolean;
  reasoning?: boolean;
  citations?: boolean;
}

export type ModelType = "chat";

export interface ModelFamilyDefinition {
  pattern: RegExp;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  features: ModelFeatures;
  type: ModelType;
}

export const ANTHROPIC_MODELS: Record<string, ModelFamilyDefinition> = {
  claude3_7_sonnet: {
    pattern: /claude-3-7-sonnet/,
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    pricing: { input: 3.0, output: 15.0 },
    features: { vision: true, tools: true, jsonMode: true, reasoning: true, citations: true },
    type: "chat"
  },
  claude3_5_sonnet: {
    pattern: /claude-3-5-sonnet/,
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    pricing: { input: 3.0, output: 15.0 },
    features: { vision: true, tools: true, jsonMode: true, citations: true },
    type: "chat"
  },
  claude3_5_haiku: {
    pattern: /claude-3-5-haiku/,
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    pricing: { input: 0.80, output: 4.0 },
    features: { vision: true, tools: true, jsonMode: true },
    type: "chat"
  },
  claude3_opus: {
    pattern: /claude-3-opus/,
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    pricing: { input: 15.0, output: 75.0 },
    features: { vision: true, tools: true, jsonMode: true },
    type: "chat"
  },
  claude3_sonnet: {
    pattern: /claude-3-sonnet/,
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    pricing: { input: 3.0, output: 15.0 },
    features: { vision: true, tools: true, jsonMode: true },
    type: "chat"
  },
  claude3_haiku: {
    pattern: /claude-3-haiku/,
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    pricing: { input: 0.25, output: 1.25 },
    features: { vision: true, tools: true, jsonMode: true },
    type: "chat"
  },
  claude2: {
    pattern: /claude-[12]/,
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    pricing: { input: 3.0, output: 15.0 },
    features: { vision: false, tools: false, jsonMode: false },
    type: "chat"
  },
  other: {
    pattern: /.*/,
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    pricing: { input: 3.0, output: 15.0 },
    features: { vision: false, tools: false, jsonMode: false },
    type: "chat"
  }
};

export class Capabilities {
  static getFamily(modelId: string): string {
    for (const [key, def] of Object.entries(ANTHROPIC_MODELS)) {
      if (key === "other") continue;
      if (def.pattern.test(modelId)) {
        return key;
      }
    }
    return "other";
  }

  static getDefinition(modelId: string): ModelFamilyDefinition {
    const family = this.getFamily(modelId);
    return ANTHROPIC_MODELS[family]!;
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

  static supportsJsonMode(modelId: string): boolean {
    return !!this.getDefinition(modelId).features.jsonMode;
  }

  static supportsExtendedThinking(modelId: string): boolean {
    return !!this.getDefinition(modelId).features.reasoning;
  }

  static getInputPrice(modelId: string): number {
    return this.getDefinition(modelId).pricing.input || 3.0;
  }

  static getOutputPrice(modelId: string): number {
    return this.getDefinition(modelId).pricing.output || 15.0;
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const modalities = {
      input: ["text"],
      output: ["text"]
    };

    if (this.supportsVision(modelId)) {
      modalities.input.push("image", "pdf");
    }

    return modalities;
  }

  static getCapabilities(modelId: string): string[] {
    const capabilities = ["streaming"];
    const def = this.getDefinition(modelId);

    if (def.features.tools) capabilities.push("function_calling");
    // Assuming all recent anthropic models support batch if they are claude-3+
    if (/claude-3/.test(modelId)) capabilities.push("batch");
    
    if (def.features.reasoning) capabilities.push("reasoning");
    if (def.features.citations) capabilities.push("citations");

    return capabilities;
  }

  static getPricing(modelId: string) {
    const def = this.getDefinition(modelId);
    const inputCpm = def.pricing.input || 3.0;
    const outputCpm = def.pricing.output || 15.0;

    const standardPricing: any = {
      input_per_million: inputCpm,
      output_per_million: outputCpm
    };

    const batchPricing: any = {
      input_per_million: inputCpm * 0.5,
      output_per_million: outputCpm * 0.5
    };

    if (this.supportsExtendedThinking(modelId)) {
      standardPricing.reasoning_output_per_million = outputCpm * 2.5;
      batchPricing.reasoning_output_per_million = outputCpm * 1.25;
    }

    return {
      text_tokens: {
        standard: standardPricing,
        batch: batchPricing
      }
    };
  }
}
