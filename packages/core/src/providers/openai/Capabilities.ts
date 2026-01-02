import { ModelRegistry } from "../../models/ModelRegistry.js";

export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    const val = ModelRegistry.getContextWindow(modelId, "openai");
    if (val) return val;

    if (/gpt-4.*(preview|turbo|vision|o)/.test(modelId) || /o1|o3/.test(modelId)) return 128_000;
    if (/gpt-4/.test(modelId)) return 8_192;
    if (/gpt-3\.5/.test(modelId)) return 16_385;
    return 128_000;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    const val = ModelRegistry.getMaxOutputTokens(modelId, "openai");
    if (val) return val;

    if (/o1.*(pro|mini)|o3/.test(modelId)) return 65_536;
    if (/gpt-4o/.test(modelId)) return 16_384;
    return 4_096;
  }

  static supportsVision(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.modalities?.input?.includes("image")) return true;
    
    return /gpt-4(?!-3)|o1/.test(modelId) && !/audio|realtime|voice/.test(modelId);
  }

  static supportsTools(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.capabilities?.includes("function_calling") || model?.capabilities?.includes("tools")) return true;
    
    return !/embedding|moderation|dall-e|tts|whisper/.test(modelId);
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.capabilities?.includes("structured_output")) return true;
    
    return /gpt-4|o1|o3/.test(modelId);
  }

  static supportsJsonMode(modelId: string): boolean {
    return this.supportsStructuredOutput(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.modalities?.output?.includes("embeddings")) return true;
    
    return /embedding/.test(modelId);
  }

  static supportsImageGeneration(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.capabilities?.includes("image_generation") || model?.modalities?.output?.includes("image")) return true;
    
    return /dall-e|image/.test(modelId);
  }

  static supportsTranscription(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.modalities?.input?.includes("audio")) return true;

    return /whisper|audio|transcribe/.test(modelId);
  }

  static supportsModeration(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.modalities?.output?.includes("moderation")) return true;
    
    return /moderation/.test(modelId);
  }

  static supportsReasoning(modelId: string): boolean {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.capabilities?.includes("reasoning")) return true;
    
    return /o\d|gpt-5/.test(modelId);
  }

  static getModelType(modelId: string): "embeddings" | "audio" | "moderation" | "image" | "chat" | "audio_transcription" | "audio_speech" {
     if (this.supportsEmbeddings(modelId)) return "embeddings";
     if (/moderation/.test(modelId)) return "moderation";
     if (/embedding/.test(modelId)) return "embeddings";
     if (/dall-e|image/.test(modelId)) return "image";
     if (/whisper|transcribe/.test(modelId)) return "audio_transcription";
     if (/tts|speech/.test(modelId)) return "audio_speech";
     if (/audio/.test(modelId)) return "audio";
     return "chat";
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const input = ["text"];
    const output = ["text"];
    
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.modalities) return model.modalities;

    if (this.supportsVision(modelId)) input.push("image", "pdf");
    if (this.supportsTranscription(modelId)) input.push("audio");
    
    if (this.supportsImageGeneration(modelId)) output.push("image");
    if (this.supportsEmbeddings(modelId)) output.push("embeddings");
    if (this.supportsModeration(modelId)) output.push("moderation");
    
    return { input, output };
  }

  static getCapabilities(modelId: string): string[] {
    const caps = ["streaming"];
    const model = ModelRegistry.find(modelId, "openai");
    
    if (model) {
         model.capabilities.forEach(c => { if(!caps.includes(c)) caps.push(c); });
         return caps;
    }

    if (this.supportsTools(modelId)) caps.push("function_calling");
    if (this.supportsStructuredOutput(modelId)) caps.push("structured_output");
    if (this.supportsEmbeddings(modelId)) caps.push("batch");
    if (/o\d|gpt-5/.test(modelId)) caps.push("reasoning");
    
    if (this.supportsImageGeneration(modelId)) caps.push("image_generation");
    if (this.supportsTranscription(modelId)) caps.push("transcription");

    return caps;
  }

  static normalizeTemperature(temperature: number | undefined, modelId: string): number | undefined | null {
    if (/^(o\d|gpt-5)/.test(modelId)) return 1.0;
    if (/-search/.test(modelId)) return null;
    return temperature;
  }

  static formatDisplayName(modelId: string): string {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.name && model.name !== modelId) return model.name;

    return modelId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  static getPricing(modelId: string): any {
    const model = ModelRegistry.find(modelId, "openai");
    if (model?.pricing) return model.pricing;

    let input = 2.5, output = 10.0;
    if (/gpt-3/.test(modelId)) { input=0.5; output=1.5; }
    if (/mini/.test(modelId)) { input=0.15; output=0.6; }
    
    return {
      text_tokens: {
        standard: { input_per_million: input, output_per_million: output }
      }
    };
  }
}
