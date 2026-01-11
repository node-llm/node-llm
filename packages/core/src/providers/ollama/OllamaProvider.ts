import { OpenAIProvider } from "../openai/OpenAIProvider.js";
import { config } from "../../config.js";
import { OllamaModels } from "./Models.js";
import { OllamaEmbedding } from "./Embedding.js";
import { OllamaCapabilities } from "./Capabilities.js";

export interface OllamaProviderOptions {
  baseUrl?: string;
}

export class OllamaProvider extends OpenAIProvider {
  constructor(options: OllamaProviderOptions = {}) {
    super({
      apiKey: "ollama",
      baseUrl: options.baseUrl || config.ollamaApiBase || "http://localhost:11434/v1"
    });

    // Override handlers with Ollama-specific ones
    this.modelsHandler = new OllamaModels(this.baseUrl, this.options.apiKey);
    this.embeddingHandler = new OllamaEmbedding(this.baseUrl, this.options.apiKey);
    
    // Override capabilities to use OllamaCapabilities
    this.capabilities = {
      supportsVision: (modelId: string) => OllamaCapabilities.supportsVision(modelId),
      supportsTools: (modelId: string) => OllamaCapabilities.supportsTools(modelId),
      supportsStructuredOutput: (modelId: string) => OllamaCapabilities.supportsStructuredOutput(modelId),
      supportsEmbeddings: (modelId: string) => OllamaCapabilities.supportsEmbeddings(modelId),
      supportsImageGeneration: (modelId: string) => OllamaCapabilities.supportsImageGeneration(modelId),
      supportsTranscription: (modelId: string) => OllamaCapabilities.supportsTranscription(modelId),
      supportsModeration: (modelId: string) => OllamaCapabilities.supportsModeration(modelId),
      supportsReasoning: (modelId: string) => OllamaCapabilities.supportsReasoning(modelId),
      supportsDeveloperRole: (_modelId: string) => false,
      getContextWindow: (modelId: string) => OllamaCapabilities.getContextWindow(modelId),
    };
  }

  protected providerName(): string {
    return "Ollama";
  }

  public override defaultModel(feature?: string): string {
    return "llama3";
  }
}
