export type ModelFamily = 
  | "dall_e"
  | "chatgpt4o"
  | "gpt41"
  | "gpt41_mini"
  | "gpt41_nano"
  | "gpt4"
  | "gpt4_turbo"
  | "gpt45"
  | "gpt35_turbo"
  | "gpt4o"
  | "gpt4o_audio"
  | "gpt4o_mini"
  | "gpt4o_mini_audio"
  | "gpt4o_mini_realtime"
  | "gpt4o_mini_transcribe"
  | "gpt4o_mini_tts"
  | "gpt4o_realtime"
  | "gpt4o_search"
  | "gpt4o_transcribe"
  | "gpt5"
  | "gpt5_mini"
  | "gpt5_nano"
  | "o1"
  | "o1_mini"
  | "o1_pro"
  | "o3_mini"
  | "babbage"
  | "davinci"
  | "embedding3_large"
  | "embedding3_small"
  | "embedding_ada"
  | "tts1"
  | "tts1_hd"
  | "whisper"
  | "moderation"
  | "other";

const MODEL_PATTERNS: Record<string, RegExp> = {
  dall_e: /^dall-e/,
  chatgpt4o: /^chatgpt-4o/,
  gpt41: /^gpt-4\.1(?!-(?:mini|nano))/,
  gpt41_mini: /^gpt-4\.1-mini/,
  gpt41_nano: /^gpt-4\.1-nano/,
  gpt4: /^gpt-4(?:-\d{6})?$/,
  gpt4_turbo: /^gpt-4(?:\.5)?-(?:\d{6}-)?(preview|turbo)/,
  gpt35_turbo: /^gpt-3\.5-turbo/,
  gpt4o: /^gpt-4o(?!-(?:mini|audio|realtime|transcribe|tts|search))/,
  gpt4o_audio: /^gpt-4o-(?:audio)/,
  gpt4o_mini: /^gpt-4o-mini(?!-(?:audio|realtime|transcribe|tts|search))/,
  gpt4o_mini_audio: /^gpt-4o-mini-audio/,
  gpt4o_mini_realtime: /^gpt-4o-mini-realtime/,
  gpt4o_mini_transcribe: /^gpt-4o-mini-transcribe/,
  gpt4o_mini_tts: /^gpt-4o-mini-tts/,
  gpt4o_realtime: /^gpt-4o-realtime/,
  gpt4o_search: /^gpt-4o-search/,
  gpt4o_transcribe: /^gpt-4o-transcribe/,
  gpt5: /^gpt-5/,
  gpt5_mini: /^gpt-5-mini/,
  gpt5_nano: /^gpt-5-nano/,
  o1: /^o1(?!-(?:mini|pro))/,
  o1_mini: /^o1-mini/,
  o1_pro: /^o1-pro/,
  o3_mini: /^o3-mini/,
  babbage: /^babbage/,
  davinci: /^davinci/,
  embedding3_large: /^text-embedding-3-large/,
  embedding3_small: /^text-embedding-3-small/,
  embedding_ada: /^text-embedding-ada/,
  tts1: /^tts-1(?!-hd)/,
  tts1_hd: /^tts-1-hd/,
  whisper: /^whisper/,
  moderation: /^(?:omni|text)-moderation/,
};

const PRICES: Record<string, any> = {
  gpt5: { input: 1.25, output: 10.0, cached_input: 0.125 },
  gpt5_mini: { input: 0.25, output: 2.0, cached_input: 0.025 },
  gpt5_nano: { input: 0.05, output: 0.4, cached_input: 0.005 },
  gpt41: { input: 2.0, output: 8.0, cached_input: 0.5 },
  gpt41_mini: { input: 0.4, output: 1.6, cached_input: 0.1 },
  gpt41_nano: { input: 0.1, output: 0.4 },
  chatgpt4o: { input: 5.0, output: 15.0 },
  gpt4: { input: 10.0, output: 30.0 },
  gpt4_turbo: { input: 10.0, output: 30.0 },
  gpt45: { input: 75.0, output: 150.0 },
  gpt35_turbo: { input: 0.5, output: 1.5 },
  gpt4o: { input: 2.5, output: 10.0 },
  gpt4o_audio: { input: 2.5, output: 10.0, audio_input: 40.0, audio_output: 80.0 },
  gpt4o_mini: { input: 0.15, output: 0.6 },
  gpt4o_mini_audio: { input: 0.15, output: 0.6, audio_input: 10.0, audio_output: 20.0 },
  gpt4o_mini_realtime: { input: 0.6, output: 2.4 },
  gpt4o_mini_transcribe: { input: 1.25, output: 5.0, audio_input: 3.0 },
  gpt4o_mini_tts: { input: 0.6, output: 12.0 },
  gpt4o_realtime: { input: 5.0, output: 20.0 },
  gpt4o_search: { input: 2.5, output: 10.0 },
  gpt4o_transcribe: { input: 2.5, output: 10.0, audio_input: 6.0 },
  o1: { input: 15.0, output: 60.0 },
  o1_mini: { input: 1.1, output: 4.4 },
  o1_pro: { input: 150.0, output: 600.0 },
  o3_mini: { input: 1.1, output: 4.4 },
  babbage: { input: 0.4, output: 0.4 },
  davinci: { input: 2.0, output: 2.0 },
  embedding3_large: { price: 0.13 },
  embedding3_small: { price: 0.02 },
  embedding_ada: { price: 0.10 },
  tts1: { price: 15.0 },
  tts1_hd: { price: 30.0 },
  whisper: { price: 0.006 },
  moderation: { price: 0.0 }
};

export class Capabilities {
  static getFamily(modelId: string): ModelFamily {
    for (const [family, pattern] of Object.entries(MODEL_PATTERNS)) {
      if (pattern.test(modelId)) {
        return family as ModelFamily;
      }
    }
    return "other";
  }

  static getContextWindow(modelId: string): number | null {
    const family = this.getFamily(modelId);
    switch (family) {
      case "gpt41":
      case "gpt41_mini":
      case "gpt41_nano":
        return 1_047_576;
      case "gpt5":
      case "gpt5_mini":
      case "gpt5_nano":
      case "chatgpt4o":
      case "gpt4_turbo":
      case "gpt4o":
      case "gpt4o_audio":
      case "gpt4o_mini":
      case "gpt4o_mini_audio":
      case "gpt4o_mini_realtime":
      case "gpt4o_realtime":
      case "gpt4o_search":
      case "gpt4o_transcribe":
      case "o1_mini":
        return 128_000;
      case "gpt4":
        return 8_192;
      case "gpt4o_mini_transcribe":
        return 16_000;
      case "o1":
      case "o1_pro":
      case "o3_mini":
        return 200_000;
      case "gpt35_turbo":
        return 16_385;
      case "gpt4o_mini_tts":
      case "tts1":
      case "tts1_hd":
      case "whisper":
      case "moderation":
      case "embedding3_large":
      case "embedding3_small":
      case "embedding_ada":
        return null;
      default:
        return 4_096;
    }
  }

  static getMaxOutputTokens(modelId: string): number | null {
    const family = this.getFamily(modelId);
    switch (family) {
      case "gpt5":
      case "gpt5_mini":
      case "gpt5_nano":
        return 400_000;
      case "gpt41":
      case "gpt41_mini":
      case "gpt41_nano":
        return 32_768;
      case "chatgpt4o":
      case "gpt4o":
      case "gpt4o_mini":
        return 16_384;
      case "babbage":
      case "davinci":
        return 16_384;
      case "gpt4":
        return 8_192;
      case "gpt35_turbo":
        return 4_096;
      case "gpt4_turbo":
      case "gpt4o_realtime":
      case "gpt4o_mini_realtime":
        return 4_096;
      case "gpt4o_mini_transcribe":
        return 2_000;
      case "o1":
      case "o1_pro":
      case "o3_mini":
        return 100_000;
      case "o1_mini":
        return 65_536;
      case "gpt4o_mini_tts":
      case "tts1":
      case "tts1_hd":
      case "whisper":
      case "moderation":
      case "embedding3_large":
      case "embedding3_small":
      case "embedding_ada":
        return null;
      default:
        return 16_384;
    }
  }

  static supportsVision(modelId: string): boolean {
    const family = this.getFamily(modelId);
    return [
      "gpt5", "gpt5_mini", "gpt5_nano", "gpt41", "gpt41_mini", "gpt41_nano",
      "chatgpt4o", "gpt4", "gpt4_turbo", "gpt4o", "gpt4o_mini", "o1", "o1_pro",
      "moderation", "gpt4o_search", "gpt4o_mini_search"
    ].includes(family);
  }

  static supportsTools(modelId: string): boolean {
    const family = this.getFamily(modelId);
    return [
      "gpt5", "gpt5_mini", "gpt5_nano", "gpt41", "gpt41_mini", "gpt41_nano",
      "gpt4", "gpt4_turbo", "gpt4o", "gpt4o_mini", "o1", "o1_pro", "o3_mini"
    ].includes(family);
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const family = this.getFamily(modelId);
    return [
      "gpt5", "gpt5_mini", "gpt5_nano", "gpt41", "gpt41_mini", "gpt41_nano",
      "chatgpt4o", "gpt4o", "gpt4o_mini", "o1", "o1_pro", "o3_mini"
    ].includes(family);
  }

  static supportsJsonMode(modelId: string): boolean {
    return this.supportsStructuredOutput(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    return this.getModelType(modelId) === "embedding";
  }

  static getInputPrice(modelId: string): number {
    const family = this.getFamily(modelId);
    const prices = PRICES[family] || { input: 0.5 };
    return prices.input || prices.price || 0.5;
  }

  static getCachedInputPrice(modelId: string): number | undefined {
    const family = this.getFamily(modelId);
    const prices = PRICES[family] || {};
    return prices.cached_input;
  }

  static getOutputPrice(modelId: string): number {
    const family = this.getFamily(modelId);
    const prices = PRICES[family] || { output: 1.5 };
    return prices.output || prices.price || 1.5;
  }

  static getModelType(modelId: string): "embedding" | "audio" | "moderation" | "image" | "chat" {
    const family = this.getFamily(modelId);
    if (/embedding/.test(family)) return "embedding";
    if (/^tts|whisper|gpt4o_(?:mini_)?(?:transcribe|tts)$/.test(family)) return "audio";
    if (family === "moderation") return "moderation";
    if (/dall/.test(family)) return "image";
    return "chat";
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
    const modalities = {
      input: ["text"],
      output: ["text"]
    };

    if (this.supportsVision(modelId)) modalities.input.push("image", "pdf");
    if (/whisper|audio|tts|transcribe/.test(modelId)) modalities.input.push("audio");
    if (/tts|audio/.test(modelId)) modalities.output.push("audio");
    if (/dall-e|image/.test(modelId)) modalities.output.push("image");
    if (/embedding/.test(modelId)) modalities.output.push("embeddings");
    if (/moderation/.test(modelId)) modalities.output.push("moderation");

    return modalities;
  }

  static getCapabilities(modelId: string): string[] {
    const capabilities: string[] = [];

    if (!/moderation|embedding/.test(modelId)) capabilities.push("streaming");
    if (this.supportsTools(modelId)) capabilities.push("function_calling");
    if (this.supportsStructuredOutput(modelId)) capabilities.push("structured_output");
    if (/embedding|batch/.test(modelId)) capabilities.push("batch");
    if (/o\d|gpt-5|codex/.test(modelId)) capabilities.push("reasoning");

    if (/gpt-4-turbo|gpt-4o/.test(modelId)) {
      if (/vision/.test(modelId)) capabilities.push("image_generation");
      if (/audio/.test(modelId)) {
        capabilities.push("speech_generation", "transcription");
      }
    }

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

    if (/embedding|batch/.test(modelId)) {
      pricing.text_tokens.batch = {
        input_per_million: standardPricing.input_per_million * 0.5,
        output_per_million: standardPricing.output_per_million * 0.5
      };
    }

    return pricing;
  }
}
