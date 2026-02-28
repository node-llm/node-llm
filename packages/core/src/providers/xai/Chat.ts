import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { logger } from "../../utils/logger.js";
import { handleXAIError } from "./Errors.js";
import { mapSystemMessages } from "../utils.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

interface XAIChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: XAIToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface XAIToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export class XAIChat {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const {
      model,
      messages,
      tools,
      max_tokens,
      response_format,
      thinking: _thinking,
      headers: _headers,
      requestTimeout,
      ...rest
    } = request;

    const mappedMessages = mapSystemMessages(messages, false);

    const body: Record<string, unknown> = {
      model,
      messages: mappedMessages,
      ...rest
    };

    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;
    if (response_format) body.response_format = response_format;

    const url = `${this.baseUrl}/chat/completions`;
    logger.logRequest("xAI", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...request.headers
        },
        body: JSON.stringify(body)
      },
      requestTimeout
    );

    if (!response.ok) {
      await handleXAIError(response, model);
    }

    const json = (await response.json()) as XAIChatResponse;
    logger.logResponse("xAI", response.status, response.statusText, json);

    const message = json.choices[0]?.message;
    const content = message?.content ?? null;

    const usage: Usage = {
      input_tokens: json.usage.prompt_tokens,
      output_tokens: json.usage.completion_tokens,
      total_tokens: json.usage.total_tokens
    };

    const toolCalls = message?.tool_calls?.map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));

    if (!content && (!toolCalls || toolCalls.length === 0)) {
      throw new Error("xAI returned empty response");
    }

    // Cost calculation if registered in ModelRegistry
    const calculatedUsage = ModelRegistry.calculateCost(usage, model, "xai");

    return {
      content,
      usage: calculatedUsage,
      tool_calls: toolCalls
    };
  }
}
