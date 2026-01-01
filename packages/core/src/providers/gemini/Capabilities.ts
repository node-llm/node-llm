export class Capabilities {
  static getContextWindow(modelId: string): number | null {
    const id = this.normalizeModelId(modelId);
    if (id.match(/gemini-2\.5-pro-exp-03-25|gemini-2\.0-flash|gemini-2\.0-flash-lite|gemini-1\.5-flash|gemini-1\.5-flash-8b/)) {
      return 1_048_576;
    }
    if (id.match(/gemini-1\.5-pro/)) {
      return 2_097_152;
    }
    if (id.match(/gemini-embedding-exp/)) {
      return 8_192;
    }
    if (id.match(/text-embedding-004|embedding-001/)) {
      return 2_048;
    }
    if (id.match(/aqa/)) {
      return 7_168;
    }
    return 32_768;
  }

  static getMaxOutputTokens(modelId: string): number | null {
    const id = this.normalizeModelId(modelId);
    if (id.match(/gemini-2\.5-pro-exp-03-25/)) {
      return 64_000;
    }
    if (id.match(/gemini-2\.0-flash|gemini-2\.0-flash-lite|gemini-1\.5-flash|gemini-1\.5-flash-8b|gemini-1\.5-pro/)) {
      return 8_192;
    }
    if (id.match(/text-embedding-004|embedding-001/)) {
      return 768;
    }
    if (id.match(/imagen-3/)) {
      return 4;
    }
    return 4_096;
  }

  static supportsVision(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    if (id.match(/text-embedding|embedding-001|aqa/)) {
      return false;
    }
    return !!id.match(/gemini|flash|pro|imagen/);
  }

  static supportsTools(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    if (id.match(/text-embedding|embedding-001|aqa|flash-lite|imagen|gemini-2\.0-flash-lite/)) {
      return false;
    }
    return !!id.match(/gemini|pro|flash/);
  }

  static supportsStructuredOutput(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    if (id.match(/text-embedding|embedding-001|aqa|imagen/)) {
      return false;
    }
    return true;
  }

  static supportsJsonMode(modelId: string): boolean {
    return this.supportsStructuredOutput(modelId);
  }

  static supportsEmbeddings(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    return !!id.match(/text-embedding|embedding|gemini-embedding/);
  }

  static supportsImageGeneration(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    return !!id.match(/imagen/);
  }

  static supportsTranscription(modelId: string): boolean {
    const id = this.normalizeModelId(modelId);
    return !!id.match(/gemini|flash|pro/);
  }

  static supportsModeration(modelId: string): boolean {
    return false;
  }

  static normalizeTemperature(temperature: number | undefined, _modelId: string): number | undefined | null {
    return temperature;
  }

  static getFamily(modelId: string): string {
    const id = this.normalizeModelId(modelId);
    if (id.startsWith("gemini-1.5-pro")) return "gemini-1.5-pro";
    if (id.startsWith("gemini-1.5-flash")) return "gemini-1.5-flash";
    if (id.startsWith("gemini-2.0-flash")) return "gemini-2.0-flash";
    if (id.startsWith("gemini-2.0-flash-lite")) return "gemini-2.0-flash-lite";
    if (id.startsWith("text-embedding")) return "text-embedding";
    if (id.startsWith("imagen")) return "imagen";
    return "other";
  }

  static getModalities(modelId: string): { input: string[]; output: string[] } {
    const input = ["text"];
    const output = ["text"];
    const id = this.normalizeModelId(modelId);

    if (this.supportsVision(id)) input.push("image", "video", "audio", "pdf");
    if (this.supportsImageGeneration(id)) output.push("image");
    if (this.supportsEmbeddings(id)) output.push("embeddings");

    return { input, output };
  }

  static getCapabilities(modelId: string): string[] {
    const caps = ["streaming"];
    const id = this.normalizeModelId(modelId);
    if (this.supportsTools(id)) caps.push("function_calling");
    if (this.supportsStructuredOutput(id)) caps.push("structured_output");
    if (this.supportsEmbeddings(id)) caps.push("embeddings");
    if (this.supportsImageGeneration(id)) caps.push("image_generation");
    return caps;
  }

  static getPricing(modelId: string) {
    const id = this.normalizeModelId(modelId);
    let input = 0;
    let output = 0;

    if (id.match(/gemini-1\.5-flash/)) {
      input = 0.075;
      output = 0.3;
    } else if (id.match(/gemini-1\.5-pro/)) {
      input = 3.5;
      output = 10.5;
    } else if (id.match(/gemini-2\.0-flash/)) {
      input = 0.10;
      output = 0.40;
    }

    return {
      text_tokens: {
        standard: {
          input_per_million: input,
          output_per_million: output
        }
      }
    };
  }

  static formatDisplayName(modelId: string): string {
    return modelId.replace("models/", "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  private static normalizeModelId(modelId: string): string {
    return modelId.replace("models/", "");
  }
}
