import { OpenAIEmbedding } from "../openai/Embedding.js";
import type { AzureProvider } from "./AzureProvider.js";
import { AzureCapabilities } from "./Capabilities.js";

export class AzureEmbedding extends OpenAIEmbedding {
  constructor(private readonly provider: AzureProvider) {
    super(provider.apiBase(), "");
  }

  protected override getProviderName(): string {
    return "azure";
  }

  protected override validateModel(model: string): void {
    if (!AzureCapabilities.supportsEmbeddings(this.provider.registryModel(model))) {
      throw new Error(`Model ${model} does not support embeddings.`);
    }
  }

  protected override endpoint(): string {
    return this.provider.url("/embeddings");
  }

  protected override requestHeaders(): Record<string, string> {
    return this.provider.headers();
  }
}
