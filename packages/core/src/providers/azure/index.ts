import { providerRegistry } from "../registry.js";
import { AzureOpenAIProvider } from "./AzureOpenAIProvider.js";
import { NodeLLMConfig } from "../../config.js";

export * from "./AzureOpenAIProvider.js";

/**
 * Register the Azure OpenAI provider.
 */
export function registerAzureProvider(config?: NodeLLMConfig) {
  providerRegistry.register("azure", (cfg?: NodeLLMConfig) => {
    const activeConfig = cfg || config;
    const apiKey = activeConfig?.azureApiKey;
    const baseUrl = activeConfig?.azureApiBase;

    if (!apiKey) {
      throw new Error(
        "Azure OpenAI API key not found. Please provide 'azureApiKey' in config or set AZURE_OPENAI_API_KEY environment variable."
      );
    }
    if (!baseUrl) {
      throw new Error(
        "Azure OpenAI address not found. Please provide 'azureApiBase' (a deployment's address) in config or set AZURE_OPENAI_API_BASE environment variable."
      );
    }

    return new AzureOpenAIProvider({ apiKey, baseUrl });
  });
}
