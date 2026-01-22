import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { logger } from "../../utils/logger.js";
import { mapSystemMessages } from "../utils.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

interface DeepSeekChatResponse {
  id: string;
  choices: Array<{
    message: {
      content: string | null;
      reasoning_content?: string | null;
      tool_calls?: DeepSeekToolCall[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export class DeepSeekChat {
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
    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;

    // Handle structured output for DeepSeek
    if (response_format) {
      if (response_format.type === "json_schema") {
        body.response_format = { type: "json_object" };

        // Append schema instructions to the system prompt or convert to a new system message
        const schema = response_format.json_schema;
        const schemaString = JSON.stringify(schema?.schema, null, 2);
        const instruction = `\n\nIMPORTANT: You must output strictly valid JSON conforming to the following schema:\n${schemaString}\n\nOutput only the JSON object.`;

        // Find system message or append to last user message
        const messagesList = body.messages as { role: string; content: string }[];
        const systemMessage = messagesList.find(
          (m) => m.role === "system" || m.role === "developer"
        );
        if (systemMessage) {
          systemMessage.content += instruction;
        } else {
          // Insert system message at the beginning
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
    logger.logRequest("DeepSeek", "POST", url, body);

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
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const json = (await response.json()) as DeepSeekChatResponse;
    logger.logResponse("DeepSeek", response.status, response.statusText, json);

    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const reasoning = message?.reasoning_content ?? null;

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

    if (!content && !reasoning && (!toolCalls || toolCalls.length === 0)) {
      throw new Error("DeepSeek returned empty response");
    }

    // deepseek cost calculation if needed, otherwise just return usage
    const calculatedUsage = ModelRegistry.calculateCost(usage, model, "deepseek");

    const thinkingResult = reasoning ? { text: reasoning } : undefined;

    return {
      content,
      reasoning,
      usage: calculatedUsage,
      thinking: thinkingResult,
      tool_calls: toolCalls
    };
  }
}
