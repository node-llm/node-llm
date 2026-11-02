import { type ListedModel, OpenAIModels } from "../openai/Models.js";
import type { AzureProvider } from "./AzureProvider.js";

type AzureListedModel = ListedModel & { deprecation?: { inference?: number } };

/** The models the resource's region offers, which can be deployed; not the deployments. */
export class AzureModels extends OpenAIModels {
  constructor(private readonly provider: AzureProvider) {
    super(provider.apiBase(), "");
  }

  protected override getProviderName(): string {
    return "azure";
  }

  protected override endpoint(): string {
    return this.provider.url("/models");
  }

  protected override requestHeaders(): Record<string, string> {
    return this.provider.headers();
  }

  // Azure lists a model once for each region it is offered in, and keeps listing retired ones.
  protected override listed(data: AzureListedModel[]): AzureListedModel[] {
    const seen = new Set<string>();
    return data.filter((model) => {
      if (seen.has(model.id)) return false;
      seen.add(model.id);
      const retiresAt = model.deprecation?.inference;
      return !(typeof retiresAt === "number" && retiresAt * 1000 < Date.now());
    });
  }
}
