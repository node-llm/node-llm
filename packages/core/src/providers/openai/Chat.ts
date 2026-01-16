import { ChatRequest, ChatResponse } from "../Provider.js";
import { OpenAIChatResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

import { OpenAIProvider } from "./OpenAIProvider.js";
import { mapSystemMessages } from "../utils.js";

export class OpenAIChat {
  private readonly baseUrl: string;

  constructor(
    private readonly providerOrUrl: OpenAIProvider | string,
    private readonly apiKey: string
  ) {
    this.baseUrl = typeof providerOrUrl === "string" ? providerOrUrl : providerOrUrl.apiBase();
  }

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);

    const isMainOpenAI = this.baseUrl.includes("api.openai.com");
    const supportsDeveloperRole =
      isMainOpenAI &&
      (typeof this.providerOrUrl === "string"
        ? Capabilities.supportsDeveloperRole(request.model)
        : this.providerOrUrl.capabilities?.supportsDeveloperRole(request.model));

    const {
      model,
      messages,
      tools,
      temperature: _,
      max_tokens,
      response_format,
      headers: _headers,
      requestTimeout: _requestTimeout,
      signal,
      ...rest
    } = request;

    const mappedMessages = mapSystemMessages(messages, !!supportsDeveloperRole);

    const body: Record<string, unknown> = {
      model,
      messages: mappedMessages,
      ...rest
    };

    if (temperature !== undefined && temperature !== null) body.temperature = temperature;

    if (max_tokens) {
      if (Capabilities.needsMaxCompletionTokens(request.model)) {
        body.max_completion_tokens = max_tokens;
      } else {
        body.max_tokens = max_tokens;
      }
    }

    if (tools) body.tools = tools;
    if (response_format) body.response_format = response_format;

    const url = buildUrl(this.baseUrl, "/chat/completions");
    logger.logRequest("OpenAI", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...request.headers
        },
        body: JSON.stringify(body),
        signal: signal as AbortSignal | null | undefined
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleOpenAIError(response, request.model);
    }

    const json = (await response.json()) as OpenAIChatResponse;
    logger.logResponse("OpenAI", response.status, response.statusText, json);

    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const tool_calls = message?.tool_calls;
    const reasoning = (message as unknown as { reasoning_content?: string })?.reasoning_content || null;

    const usage = json.usage
      ? {
          input_tokens: json.usage.prompt_tokens,
          output_tokens: json.usage.completion_tokens,
          total_tokens: json.usage.total_tokens,
          cached_tokens: json.usage.prompt_tokens_details?.cached_tokens,
          reasoning_tokens: json.usage.completion_tokens_details?.reasoning_tokens
        }
      : undefined;

    if (!content && !tool_calls) {
      throw new Error("OpenAI returned empty response");
    }

    const calculatedUsage = usage ? ModelRegistry.calculateCost(usage, model, "openai") : undefined;

    return { content, tool_calls, usage: calculatedUsage, reasoning };
  }
}
