import { OpenAIProvider } from "../openai/OpenAIProvider.js";
import { OpenRouterCapabilities } from "./Capabilities.js";

export interface OpenRouterProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class OpenRouterProvider extends OpenAIProvider {
  public capabilities = {
    supportsVision: (model: string) => OpenRouterCapabilities.supportsVision(model),
    supportsTools: (model: string) => OpenRouterCapabilities.supportsTools(model),
    supportsStructuredOutput: (model: string) => OpenRouterCapabilities.supportsStructuredOutput(model),
    supportsEmbeddings: (model: string) => OpenRouterCapabilities.supportsEmbeddings(model),
    supportsImageGeneration: (model: string) => OpenRouterCapabilities.supportsImageGeneration(model),
    supportsTranscription: (model: string) => OpenRouterCapabilities.supportsTranscription(model),
    supportsModeration: (model: string) => OpenRouterCapabilities.supportsModeration(model),
    supportsReasoning: (model: string) => OpenRouterCapabilities.supportsReasoning(model),
    supportsDeveloperRole: (_model: string) => true,
    getContextWindow: (model: string) => OpenRouterCapabilities.getContextWindow(model) || null,
  };

  constructor(options: OpenRouterProviderOptions) {
    super({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl || "https://openrouter.ai/api/v1"
    });
  }

  protected providerName(): string {
    return "OpenRouter";
  }
}
