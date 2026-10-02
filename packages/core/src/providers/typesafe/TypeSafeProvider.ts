import { BaseProvider } from "../BaseProvider.js";
import {
  ChatRequest,
  ChatResponse,
  JudgmentRequest,
  JudgmentResponse,
  ModelInfo
} from "../Provider.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { logger } from "../../utils/logger.js";
import { DEFAULT_MODELS, DEFAULT_TYPESAFE_BASE_URL } from "../../constants.js";
import { handleTypeSafeError, parseJudgmentResponse, renderJudgmentPayload } from "./SystemOne.js";

export interface TypeSafeProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

/**
 * TypeSafe's System One models (Jev) answer typed questions with calibrated
 * probabilities. They do not generate text, so this provider offers judgments
 * and a model listing only; chat and every other operation are unsupported.
 *
 * Any server implementing the same System One API works by pointing
 * `typesafeApiBase` at it.
 */
export class TypeSafeProvider extends BaseProvider {
  private readonly baseUrl: string;

  constructor(private readonly options: TypeSafeProviderOptions) {
    super();
    this.baseUrl = (options.baseUrl || DEFAULT_TYPESAFE_BASE_URL).replace(/\/+$/, "");
    this.capabilities = this.defaultCapabilities();
  }

  apiBase(): string {
    return this.baseUrl;
  }

  headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  protected providerName(): string {
    return "typesafe";
  }

  defaultModel(feature?: string): string {
    return feature === undefined || feature === "judgment" ? DEFAULT_MODELS.JUDGMENT : "";
  }

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    this.throwUnsupportedError("chat (TypeSafe models answer judgments, not chat)");
  }

  async judge(request: JudgmentRequest): Promise<JudgmentResponse> {
    const url = `${this.baseUrl}/v1/systemone`;
    const body = renderJudgmentPayload(request);
    logger.logRequest("TypeSafe", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      { method: "POST", headers: this.headers(), body: JSON.stringify(body) },
      request.requestTimeout
    );

    if (!response.ok) await handleTypeSafeError(response, request.model);

    const json = await response.json();
    logger.logResponse("TypeSafe", response.status, response.statusText, json);
    return parseJudgmentResponse(json, request.questions);
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetchWithTimeout(`${this.baseUrl}/v1/models`, {
      method: "GET",
      headers: this.headers()
    });
    if (!response.ok) await handleTypeSafeError(response);

    const json = (await response.json()) as {
      models?: Array<{ name: string; description?: string; release_date?: string }>;
    };

    return (json.models ?? []).map((entry) => ({
      id: entry.name,
      name: entry.name,
      provider: "typesafe",
      family: "jev",
      context_window: null,
      max_output_tokens: null,
      modalities: { input: ["text"], output: ["judgment"] },
      capabilities: ["judgment"],
      pricing: {},
      metadata: {
        ...(entry.description ? { description: entry.description } : {}),
        ...(entry.release_date ? { created_at: entry.release_date } : {})
      }
    }));
  }
}
