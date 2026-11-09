import { checkApiBase } from "../apiBase.js";
import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { AzureProvider } from "./AzureProvider.js";

export * from "./AzureProvider.js";
export * from "./Capabilities.js";

let registered = false;

export function registerAzureProvider() {
  if (registered) return;

  providerRegistry.register("azure", (config) => {
    const cfg = config || globalConfig;
    const baseUrl = checkApiBase("azureApiBase", cfg.azureApiBase, {
      example: "https://RESOURCE.openai.azure.com"
    });

    if (!baseUrl) {
      throw new Error(
        "azureApiBase is not set in config or AZURE_API_BASE environment variable: give the address the Azure portal shows for your deployment or resource"
      );
    }
    if (!cfg.azureApiKey && !cfg.azureAuthToken) {
      throw new Error(
        "azureApiKey or azureAuthToken is not set in config or AZURE_API_KEY / AZURE_AUTH_TOKEN environment variables"
      );
    }

    return new AzureProvider({
      apiKey: cfg.azureApiKey,
      authToken: cfg.azureAuthToken,
      baseUrl,
      deployments: cfg.azureDeployments
    });
  });

  registered = true;
}

export const ensureAzureRegistered = registerAzureProvider;
