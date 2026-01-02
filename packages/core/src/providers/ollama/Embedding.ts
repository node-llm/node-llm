import { OpenAIEmbedding } from "../openai/Embedding.js";
import { OllamaCapabilities } from "./Capabilities.js";

export class OllamaEmbedding extends OpenAIEmbedding {
  protected override getProviderName(): string {
    return "ollama";
  }

  protected override validateModel(model: string): void {
    if (!OllamaCapabilities.supportsEmbeddings(model)) {
      throw new Error(`Model ${model} does not support embeddings.`);
    }
  }
}
