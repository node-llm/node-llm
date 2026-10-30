import { OpenAIProvider } from "../openai/OpenAIProvider.js";
import { Capabilities } from "../openai/Capabilities.js";
import { ChatRequest } from "../Provider.js";

export interface AzureOpenAIProviderOptions {
  apiKey: string;
  /**
   * A deployment's address, such as
   * https://my-resource.openai.azure.com/openai/deployments/my-gpt?api-version=2025-04-01-preview,
   * or the resource's v1 address, https://my-resource.openai.azure.com/openai/v1, with the
   * deployment's name as the model.
   */
  baseUrl: string;
}

const DEPLOYMENT = /^(https?:\/\/[^/]+)\/openai\/deployments\/([^/?]+)/;

/**
 * Azure OpenAI: OpenAI's API on an Azure resource, signed with the resource's key. With a
 * deployment's address, the model names what the deployment runs, such as gpt-6-luna, so
 * capabilities and pricing are known; the address says which deployment answers.
 */
export class AzureOpenAIProvider extends OpenAIProvider {
  constructor(options: AzureOpenAIProviderOptions) {
    super({ apiKey: options.apiKey, baseUrl: options.baseUrl });
  }

  public override headers(): Record<string, string> {
    return { "api-key": this.options.apiKey, "Content-Type": "application/json" };
  }

  // Azure serves the Responses API from the resource's v1 address, not under a deployment.
  public override responsesBase(): string {
    const deployment = DEPLOYMENT.exec(this.apiBase());
    return deployment ? `${deployment[1]}/openai/v1` : this.apiBase();
  }

  public override responsesModel(model: string): string {
    return DEPLOYMENT.exec(this.apiBase())?.[2] ?? model;
  }

  // Unlike OpenAI's own API, the address says nothing about the model, so only the model decides.
  protected override usesResponsesApi(request: ChatRequest): boolean {
    return !!request.tools?.length && Capabilities.needsResponsesForTools(request.model);
  }

  protected override providerName(): string {
    return "Azure OpenAI";
  }
}
