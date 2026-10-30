import { ChatRequest, ChatResponse } from "../Provider.js";
import { Message } from "../../chat/Message.js";
import { ContentPart } from "../../chat/Content.js";
import { ToolCall } from "../../chat/Tool.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { enforceStrictSchema } from "../../schema/strict.js";

type ResponsesInputItem = Record<string, unknown>;

interface ResponsesOutputItem {
  type: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  content?: { type: string; text?: string }[];
}

interface ResponsesResult {
  output?: ResponsesOutputItem[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_tokens_details?: { cached_tokens?: number };
    output_tokens_details?: { reasoning_tokens?: number };
  };
}

/**
 * Some OpenAI models only accept function tools through the Responses API: Chat Completions
 * rejects them ("use /v1/responses"). Requests that would fail that way go here; everything else
 * keeps using Chat Completions.
 */
export function needsResponsesApi(request: ChatRequest, baseUrl: string): boolean {
  return (
    baseUrl.includes("api.openai.com") &&
    !!request.tools?.length &&
    Capabilities.needsResponsesForTools(request.model)
  );
}

function contentParts(content: string | ContentPart[] | null | undefined, role: string) {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;

  const textType = role === "assistant" ? "output_text" : "input_text";
  return content.flatMap((part): Record<string, string>[] => {
    if (part.type === "text") return [{ type: textType, text: part.text }];
    if (part.type === "image_url") return [{ type: "input_image", image_url: part.image_url.url }];
    return [];
  });
}

/** Chat Completions messages as Responses input items: tool calls and results become items. */
function inputItems(messages: Message[]): ResponsesInputItem[] {
  return messages.flatMap((message): ResponsesInputItem[] => {
    if (message.role === "tool") {
      return [
        {
          type: "function_call_output",
          call_id: message.tool_call_id,
          output:
            typeof message.content === "string" ? message.content : JSON.stringify(message.content)
        }
      ];
    }

    const items: ResponsesInputItem[] = [];
    const content = contentParts(message.content as string | ContentPart[] | null, message.role);
    if (content !== "" && !(Array.isArray(content) && content.length === 0)) {
      items.push({ role: message.role, content });
    }
    for (const call of message.tool_calls ?? []) {
      items.push({
        type: "function_call",
        call_id: call.id,
        name: call.function.name,
        arguments: call.function.arguments
      });
    }
    return items;
  });
}

function toolChoice(choice: ChatRequest["tool_choice"]) {
  if (choice === undefined) return undefined;
  if (typeof choice === "string") return choice;
  const name = (choice as { function?: { name?: string } }).function?.name;
  return name ? { type: "function", name } : choice;
}

function textFormat(format: ChatRequest["response_format"]) {
  if (!format) return undefined;
  if (format.type === "json_schema" && format.json_schema) {
    const { name, schema, strict } = format.json_schema;
    return {
      type: "json_schema",
      name: name ?? "response",
      schema: strict === true ? enforceStrictSchema(schema as Record<string, unknown>) : schema,
      strict
    };
  }
  return { type: format.type };
}

/**
 * Chat through OpenAI's Responses API, for requests Chat Completions can't serve. Nothing is
 * stored on OpenAI's side: like every other NodeLLM chat, each request carries the conversation.
 */
export class OpenAIResponses {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const {
      model,
      messages,
      tools,
      temperature: _temperature,
      max_tokens,
      response_format,
      thinking,
      headers: _headers,
      requestTimeout: _requestTimeout,
      signal,
      prediction: _prediction,
      tool_choice,
      parallel_tool_calls,
      ...rest
    } = request;

    const body: Record<string, unknown> = {
      model,
      input: inputItems(messages),
      store: false,
      ...rest
    };

    const temperature = Capabilities.normalizeTemperature(request.temperature, model);
    if (temperature !== undefined && temperature !== null) body.temperature = temperature;
    if (max_tokens) body.max_output_tokens = max_tokens;
    if (parallel_tool_calls !== undefined) body.parallel_tool_calls = parallel_tool_calls;
    if (thinking?.effort && thinking.effort !== "none")
      body.reasoning = { effort: thinking.effort };

    if (tools?.length) {
      body.tools = tools.map((tool) => ({
        type: "function",
        name: tool.function.name,
        description: tool.function.description,
        parameters:
          tool.function.strict === true
            ? enforceStrictSchema(tool.function.parameters as Record<string, unknown>)
            : tool.function.parameters,
        ...(tool.function.strict !== undefined ? { strict: tool.function.strict } : {})
      }));
    }
    const choice = toolChoice(tool_choice);
    if (choice !== undefined) body.tool_choice = choice;
    const format = textFormat(response_format);
    if (format) body.text = { format };

    const url = buildUrl(this.baseUrl, "/responses");
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
        signal
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleOpenAIError(response, model);
    }

    const json = (await response.json()) as ResponsesResult;
    logger.logResponse("OpenAI", response.status, response.statusText, json);

    const output = json.output ?? [];
    const text = output
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text ?? "")
      .join("");
    const toolCalls: ToolCall[] = output
      .filter((item) => item.type === "function_call")
      .map((item) => ({
        id: item.call_id ?? "",
        type: "function",
        function: { name: item.name ?? "", arguments: item.arguments ?? "{}" }
      }));

    if (!text && toolCalls.length === 0) {
      throw new Error("OpenAI returned empty response");
    }

    const usage = json.usage
      ? ModelRegistry.calculateCost(
          {
            input_tokens: json.usage.input_tokens,
            output_tokens: json.usage.output_tokens,
            total_tokens: json.usage.total_tokens,
            cached_tokens: json.usage.input_tokens_details?.cached_tokens,
            reasoning_tokens: json.usage.output_tokens_details?.reasoning_tokens
          },
          model,
          "openai"
        )
      : undefined;
    const reasoningTokens = json.usage?.output_tokens_details?.reasoning_tokens;

    return {
      content: text || null,
      tool_calls: toolCalls.length ? toolCalls : undefined,
      usage,
      thinking: reasoningTokens ? { tokens: reasoningTokens } : undefined
    };
  }
}
