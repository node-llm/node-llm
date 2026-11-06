import { OpenAIProvider } from "../openai/OpenAIProvider.js";
import { Capabilities } from "../openai/Capabilities.js";
import {
  ChatRequest,
  ImageRequest,
  ImageResponse,
  TranscriptionRequest,
  TranscriptionResponse,
  ModerationRequest,
  ModerationResponse
} from "../Provider.js";
import { AzureCapabilities } from "./Capabilities.js";
import { AzureEmbedding } from "./Embedding.js";
import { AzureModels } from "./Models.js";

export interface AzureProviderOptions {
  /** The resource's key. Leave it out to sign with authToken instead. */
  apiKey?: string;
  /** A Microsoft Entra ID access token, for resources that sign in without keys */
  authToken?: string;
  /**
   * The address the Azure portal shows for a deployment or resource:
   * - a deployment's, https://my-resource.openai.azure.com/openai/deployments/my-gpt?api-version=…
   * - a model endpoint's, https://my-resource.services.ai.azure.com/models/chat/completions?api-version=…
   * - the resource's v1 address, https://my-resource.services.ai.azure.com/openai/v1
   * - the resource itself, https://my-resource.services.ai.azure.com
   */
  baseUrl: string;
  /** Deployment names mapped to the models they run, so capabilities and pricing are known */
  deployments?: Record<string, string>;
}

// The versions Azure documents, for addresses that don't name one.
const CHAT_API_VERSION = "2024-05-01-preview";
const MODELS_API_VERSION = "preview";

type Address = {
  /** The address without its query or trailing slash */
  path: string;
  /** The resource's own address, such as https://my-resource.services.ai.azure.com */
  root: string;
  version?: string;
  shape: "endpoint" | "deployment" | "v1" | "resource";
};

const parseAddress = (baseUrl: string): Address => {
  const url = new URL(baseUrl);
  const path = `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  const shape = path.endsWith("/chat/completions")
    ? "endpoint"
    : path.includes("/openai/deployments/")
      ? "deployment"
      : path.endsWith("/openai/v1")
        ? "v1"
        : "resource";
  const root = path.replace(/\/chat\/completions$/, "").replace(/\/(models|openai)(\/.*)?$/, "");
  return { path, root, version: url.searchParams.get("api-version") ?? undefined, shape };
};

const withVersion = (url: string, version?: string) =>
  version ? `${url}?api-version=${version}` : url;

/**
 * Azure AI Foundry: the models deployed on an Azure resource, OpenAI's and others' such as Llama,
 * DeepSeek, Mistral and Grok, through its OpenAI-compatible APIs. The model is the deployment's
 * name; `deployments` says which model each one runs when the names differ.
 */
export class AzureProvider extends OpenAIProvider {
  private readonly address: Address;
  private readonly deployments: Record<string, string>;

  public capabilities = {
    supportsVision: (model: string) => AzureCapabilities.supportsVision(this.registryModel(model)),
    supportsTools: (model: string) => AzureCapabilities.supportsTools(this.registryModel(model)),
    supportsStructuredOutput: (model: string) =>
      AzureCapabilities.supportsStructuredOutput(this.registryModel(model)),
    supportsEmbeddings: (model: string) =>
      AzureCapabilities.supportsEmbeddings(this.registryModel(model)),
    supportsImageGeneration: (_model: string) => false,
    supportsTranscription: (_model: string) => false,
    supportsModeration: (_model: string) => false,
    supportsReasoning: (model: string) =>
      AzureCapabilities.supportsReasoning(this.registryModel(model)),
    supportsDeveloperRole: (_model: string) => false,
    supportsPrediction: (_model: string) => false,
    supportsTemperature: (model: string) =>
      AzureCapabilities.supportsTemperature(this.registryModel(model)),
    getContextWindow: (model: string) =>
      AzureCapabilities.getContextWindow(this.registryModel(model))
  };

  constructor(private readonly azure: AzureProviderOptions) {
    super({ apiKey: azure.apiKey ?? "", baseUrl: azure.baseUrl });
    this.address = parseAddress(azure.baseUrl);
    this.deployments = azure.deployments ?? {};
    this.embeddingHandler = new AzureEmbedding(this);
    this.modelsHandler = new AzureModels(this);
  }

  // Serverless endpoints take the key as a bearer token; resources take it as api-key.
  public override headers(): Record<string, string> {
    const serverless = new URL(this.address.root).hostname.endsWith(".models.ai.azure.com");
    const auth: Record<string, string> = !this.azure.apiKey
      ? { Authorization: `Bearer ${this.azure.authToken}` }
      : serverless
        ? { Authorization: `Bearer ${this.azure.apiKey}` }
        : { "api-key": this.azure.apiKey };
    return { ...auth, "Content-Type": "application/json" };
  }

  public override url(path: string): string {
    const { shape, path: base, root, version } = this.address;
    if (path === "/chat/completions") {
      if (shape === "endpoint") return this.azure.baseUrl;
      if (shape === "deployment") return withVersion(`${base}${path}`, version ?? CHAT_API_VERSION);
      if (shape === "v1") return withVersion(`${base}${path}`, version);
      return withVersion(`${root}/models${path}`, version ?? CHAT_API_VERSION);
    }
    if (path === "/embeddings" && shape === "deployment") {
      return withVersion(`${base}${path}`, version ?? CHAT_API_VERSION);
    }
    if (path === "/models")
      return withVersion(`${this.responsesBase()}${path}`, MODELS_API_VERSION);
    return withVersion(`${this.responsesBase()}${path}`, shape === "v1" ? version : undefined);
  }

  public override registryModel(model: string): string {
    if (this.deployments[model]) return this.deployments[model];
    const match = model.match(
      /(gpt-4o-mini|gpt-4o|gpt-4\.1-mini|gpt-4\.1-nano|gpt-4\.1|gpt-5\.[0-9]+-mini|gpt-5\.[0-9]+|gpt-5-mini|gpt-5-nano|gpt-5|gpt-6-[a-z0-9]+|gpt-6|gpt-4-turbo|gpt-4|o[1-4]-mini|o[1-4])/i
    );
    return match?.[1] ? match[1].toLowerCase() : model;
  }

  // The Responses API is served from the resource's v1 address, never under a deployment.
  public override responsesBase(): string {
    const { shape, path, root } = this.address;
    return shape === "v1" ? path : `${root}/openai/v1`;
  }

  public override responsesModel(model: string): string {
    return this.address.path.match(/\/openai\/deployments\/([^/]+)/)?.[1] ?? model;
  }

  // Unlike OpenAI's own API, the address says nothing about the model, so only the model decides.
  protected override usesResponsesApi(request: ChatRequest): boolean {
    return (
      !!request.tools?.length &&
      Capabilities.needsResponsesForTools(this.registryModel(request.model))
    );
  }

  protected override providerName(): string {
    return "Azure";
  }

  override async paint(_request: ImageRequest): Promise<ImageResponse> {
    return this.throwUnsupportedError("paint");
  }

  override async transcribe(_request: TranscriptionRequest): Promise<TranscriptionResponse> {
    return this.throwUnsupportedError("transcribe");
  }

  override async moderate(_request: ModerationRequest): Promise<ModerationResponse> {
    return this.throwUnsupportedError("moderate");
  }
}
