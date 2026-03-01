import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { logger } from "../../utils/logger.js";
import { handleMistralError } from "./Errors.js";
import { mapSystemMessages } from "../utils.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

interface MistralContentPart {
  type: "text" | "thinking";
  content?: string;
  thinking?: string;
}

interface MistralChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | MistralContentPart[] | null;
      tool_calls?: MistralToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MistralToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export class MistralChat {
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
      signal: _signal,
      ...rest
    } = request;

    const mappedMessages = mapSystemMessages(messages, false);

    // Sanitize messages - remove internal properties that Mistral API doesn't accept
    const sanitizedMessages = mappedMessages.map((msg) => {
      const m = msg as unknown as Record<string, unknown>;
      const { role, content, tool_calls, tool_call_id, name } = m;
      const clean: Record<string, unknown> = { role, content };
      if (tool_calls) clean.tool_calls = tool_calls;
      if (tool_call_id) clean.tool_call_id = tool_call_id;
      if (name) clean.name = name;
      return clean;
    });

    const body: Record<string, unknown> = {
      model,
      messages: sanitizedMessages,
      ...rest
    };

    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;

    // Handle structured output for Mistral
    if (response_format) {
      if (response_format.type === "json_schema") {
        // Mistral supports JSON mode
        body.response_format = { type: "json_object" };

        // Append schema instructions to the system prompt
        const schema = response_format.json_schema;
        const schemaString = JSON.stringify(schema?.schema, null, 2);
        const instruction = `\n\nIMPORTANT: You must output strictly valid JSON conforming to the following schema:\n${schemaString}\n\nOutput only the JSON object.`;

        const messagesList = body.messages as { role: string; content: string }[];
        const systemMessage = messagesList.find((m) => m.role === "system");
        if (systemMessage) {
          systemMessage.content += instruction;
        } else {
          messagesList.unshift({
            role: "system",
            content: "You are a helpful assistant." + instruction
          });
        }
      } else {
        body.response_format = response_format;
      }
    }

    const url = `${this.baseUrl}/chat/completions`;
    logger.logRequest("Mistral", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...request.headers
        },
        body: JSON.stringify(body)
      },
      requestTimeout
    );

    if (!response.ok) {
      await handleMistralError(response, model);
    }

    const json = (await response.json()) as MistralChatResponse;
    logger.logResponse("Mistral", response.status, response.statusText, json);

    const choice = json.choices?.[0];
    const message = choice?.message;

    // Parse content - magistral models return array with thinking and text parts
    let textContent: string | null = null;
    let reasoningText: string | null = null;

    if (Array.isArray(message?.content)) {
      // Magistral models: content is array of parts
      for (const part of message.content) {
        if (part.type === "thinking" && part.thinking) {
          reasoningText = (reasoningText || "") + part.thinking;
        } else if (part.type === "text" && part.content) {
          textContent = (textContent || "") + part.content;
        }
      }
    } else {
      textContent = message?.content ?? null;
    }

    // Map tool calls to standard format
    const toolCalls = message?.tool_calls?.map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments
      }
    }));

    // Calculate cost if pricing available
    const pricing = ModelRegistry.find(model, "mistral")?.pricing;
    let cost: number | undefined;
    let inputCost: number | undefined;
    let outputCost: number | undefined;

    if (pricing?.text_tokens?.standard && json.usage) {
      const inputPrice = pricing.text_tokens.standard.input_per_million ?? 0;
      const outputPrice = pricing.text_tokens.standard.output_per_million ?? 0;

      inputCost = (json.usage.prompt_tokens / 1_000_000) * inputPrice;
      outputCost = (json.usage.completion_tokens / 1_000_000) * outputPrice;
      cost = inputCost + outputCost;
    }

    const usage: Usage = {
      input_tokens: json.usage?.prompt_tokens ?? 0,
      output_tokens: json.usage?.completion_tokens ?? 0,
      total_tokens: json.usage?.total_tokens ?? 0,
      cost,
      input_cost: inputCost,
      output_cost: outputCost
    };

    // Build thinking result for reasoning models
    const thinkingResult = reasoningText
      ? {
          text: reasoningText,
          tokens: undefined
        }
      : undefined;

    return {
      content: textContent,
      tool_calls: toolCalls,
      usage,
      finish_reason: choice?.finish_reason ?? null,
      thinking: thinkingResult,
      reasoning: reasoningText
    };
  }
}
