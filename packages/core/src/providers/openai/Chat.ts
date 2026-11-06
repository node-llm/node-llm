import { ChatRequest, ChatResponse } from "../Provider.js";
import { OpenAIChatResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

import { OpenAIProvider } from "./OpenAIProvider.js";
import { mapSystemMessages, normalizeOpenAIToolChoice } from "../utils.js";
import { enforceStrictSchema } from "../../schema/strict.js";

export class OpenAIChat {
  private readonly baseUrl: string;

  constructor(
    private readonly providerOrUrl: OpenAIProvider | string,
    private readonly apiKey: string
  ) {
    this.baseUrl = typeof providerOrUrl === "string" ? providerOrUrl : providerOrUrl.apiBase();
  }

  // A provider decides where its requests go, signs them and names the model they are priced as;
  // Azure, for one, routes by deployment and wants an api-key header, not a bearer token.
  private url(): string {
    if (typeof this.providerOrUrl === "string") return buildUrl(this.baseUrl, "/chat/completions");
    return this.providerOrUrl.url("/chat/completions");
  }

  private authHeaders(): Record<string, string> {
    if (typeof this.providerOrUrl !== "string") return this.providerOrUrl.headers();
    return { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" };
  }

  private registry(model: string): { model: string; provider: string } {
    if (typeof this.providerOrUrl === "string") return { model, provider: "openai" };
    return { model: this.providerOrUrl.registryModel(model), provider: this.providerOrUrl.id };
  }

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const known = this.registry(request.model);
    const temperature = Capabilities.normalizeTemperature(request.temperature, known.model);

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
      thinking,
      headers: _headers,
      requestTimeout: _requestTimeout,
      signal,
      prediction,
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
      if (Capabilities.needsMaxCompletionTokens(known.model)) {
        body.max_completion_tokens = max_tokens;
      } else {
        body.max_tokens = max_tokens;
      }
    }

    if (tools) {
      body.tools = tools.map((tool) => {
        if (tool.function.strict === true) {
          return {
            ...tool,
            function: {
              ...tool.function,
              parameters: enforceStrictSchema(tool.function.parameters as Record<string, unknown>)
            }
          };
        }
        return tool;
      });
    }

    if (request.tool_choice) {
      body.tool_choice = normalizeOpenAIToolChoice(request.tool_choice);
    }

    if (prediction) {
      body.prediction = {
        type: "content",
        content: prediction
      };
    }

    if (response_format) {
      if (
        response_format.type === "json_schema" &&
        response_format.json_schema?.schema &&
        response_format.json_schema.strict === true
      ) {
        body.response_format = {
          type: "json_schema",
          json_schema: {
            ...response_format.json_schema,
            schema: enforceStrictSchema(
              response_format.json_schema.schema as Record<string, unknown>
            )
          }
        };
      } else {
        body.response_format = response_format;
      }
    }

    if (thinking?.effort && thinking.effort !== "none") {
      body.reasoning_effort = thinking.effort;
    }

    // Only reaches providers that declare supportsPromptCaching, such as OpenRouter for Claude.
    if (request.promptCache) {
      body.cache_control = { type: "ephemeral" };
    }

    const url = this.url();
    logger.logRequest("OpenAI", "POST", url, body);

    let response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          ...this.authHeaders(),
          ...request.headers
        },
        body: JSON.stringify(body),
        signal
      },
      request.requestTimeout
    );

    if (!response.ok) {
      if (response.status === 400 && body.max_tokens) {
        const errorClone = response.clone();
        const errText = await errorClone.text().catch(() => "");
        if (errText.includes("max_completion_tokens") || errText.includes("max_tokens")) {
          delete body.max_tokens;
          body.max_completion_tokens = max_tokens;
          response = await fetchWithTimeout(
            url,
            {
              method: "POST",
              headers: {
                ...this.authHeaders(),
                ...request.headers
              },
              body: JSON.stringify(body),
              signal
            },
            request.requestTimeout
          );
        }
      }
      if (!response.ok) {
        await handleOpenAIError(response, request.model);
      }
    }

    const json = (await response.json()) as OpenAIChatResponse;
    logger.logResponse("OpenAI", response.status, response.statusText, json);

    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const tool_calls = message?.tool_calls;
    const reasoningText = message?.reasoning_content || null;

    const usage = json.usage
      ? {
          input_tokens: json.usage.prompt_tokens,
          output_tokens: json.usage.completion_tokens,
          total_tokens: json.usage.total_tokens,
          cached_tokens: json.usage.prompt_tokens_details?.cached_tokens,
          reasoning_tokens: json.usage.completion_tokens_details?.reasoning_tokens
        }
      : undefined;

    const thinkingResult =
      reasoningText || usage?.reasoning_tokens
        ? {
            text: reasoningText || undefined,
            tokens: usage?.reasoning_tokens
          }
        : undefined;

    if (!content && !tool_calls) {
      throw new Error("OpenAI returned empty response");
    }

    const calculatedUsage = usage
      ? ModelRegistry.calculateCost(usage, known.model, known.provider)
      : undefined;

    return {
      content,
      tool_calls,
      usage: calculatedUsage,
      thinking: thinkingResult,
      reasoning: reasoningText
    };
  }
}
