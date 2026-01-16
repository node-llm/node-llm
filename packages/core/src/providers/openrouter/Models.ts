import { ModelInfo } from "../Provider.js";

interface OpenRouterModelData {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    input_cache_read?: string;
    internal_reasoning?: string;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  supported_parameters?: string[];
  created?: number;
}

export class OpenRouterModels {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    return data.data.map((model: OpenRouterModelData) => this.parseModel(model));
  }

  private parseModel(model: OpenRouterModelData): ModelInfo {
    const family = model.id.split("/")[0] || "";

    return {
      id: model.id,
      name: model.name,
      provider: "openrouter",
      family: family,
      context_window: model.context_length,
      max_output_tokens: model.top_provider?.max_completion_tokens ?? null,
      modalities: {
        input: model.architecture?.input_modalities || [],
        output: model.architecture?.output_modalities || []
      },
      capabilities: this.parseCapabilities(model),
      pricing: this.parsePricing(model.pricing),
      metadata: {
        created_at: model.created ? new Date(model.created * 1000) : undefined,
        description: model.description,
        architecture: model.architecture,
        top_provider: model.top_provider,
        supported_parameters: model.supported_parameters
      }
    };
  }

  private parseCapabilities(model: OpenRouterModelData): string[] {
    const caps: string[] = [];
    const params = model.supported_parameters || [];
    const inputModalities = model.architecture?.input_modalities || [];

    if (params.includes("tools") || params.includes("function_calling")) {
      caps.push("tools");
    }

    if (inputModalities.includes("image")) {
      caps.push("vision");
    }

    if (model.id.includes("embedding") || model.id.includes("text-sdk")) {
      caps.push("embeddings");
    }

    // Heuristics for reasoning
    if (
      model.id.includes("o1") ||
      model.id.includes("o3") ||
      model.id.includes("deepseek-r1") ||
      model.id.includes("qwq")
    ) {
      caps.push("reasoning");
    }

    return caps;
  }

  private parsePricing(pricing: OpenRouterModelData["pricing"]) {
    const result: Record<string, unknown> = {
      text_tokens: {
        standard: {} as Record<string, number>
      }
    };

    const prompt = parseFloat(pricing.prompt);
    const completion = parseFloat(pricing.completion);
    const cachedInput = pricing.input_cache_read ? parseFloat(pricing.input_cache_read) : 0;
    const reasoning = pricing.internal_reasoning ? parseFloat(pricing.internal_reasoning) : 0;

    const standard = (result.text_tokens as Record<string, unknown>).standard as Record<string, number>;

    if (prompt > 0) {
      standard.input_per_million = prompt * 1_000_000;
    }
    if (completion > 0) {
      standard.output_per_million = completion * 1_000_000;
    }
    if (cachedInput > 0) {
      standard.cached_input_per_million = cachedInput * 1_000_000;
    }
    if (reasoning > 0) {
      standard.reasoning_output_per_million = reasoning * 1_000_000;
    }

    return result;
  }
}
