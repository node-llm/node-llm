import { ChatRequest, ChatResponse } from "../Provider.js";
import { AnthropicMessageRequest, AnthropicMessage, AnthropicContentBlock, AnthropicMessageResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleAnthropicError } from "./Errors.js";
import { Message } from "../../chat/Message.js";
import { ContentPart } from "../../chat/Content.js";

import { formatSystemPrompt, formatMessages } from "./Utils.js";

export class AnthropicChat {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model;
    const maxTokens = request.max_tokens || Capabilities.getMaxOutputTokens(model) || 4096;

    const systemPrompt = formatSystemPrompt(request.messages);
    const messages = formatMessages(request.messages);

    let system = systemPrompt;
    if (request.response_format) {
      let schemaText = "";
      if (request.response_format.type === "json_schema" && request.response_format.json_schema?.schema) {
        schemaText = "\nSchema:\n" + JSON.stringify(request.response_format.json_schema.schema, null, 2);
      }
      const instruction = `CRITICAL: Respond ONLY with a valid JSON object matching the requested schema.${schemaText}\n\nDo not include any other text or explanation.`;
      system = system ? `${system}\n\n${instruction}` : instruction;
    }

    const body: AnthropicMessageRequest = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      system: system,
      stream: false, // For now, no streaming
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    // Map tools
    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      }));
    }

    // Check if any message contains PDF content to add beta header
    const hasPdf = messages.some(msg => 
      Array.isArray(msg.content) && msg.content.some(block => block.type === "document")
    );

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...request.headers,
    };

    if (hasPdf) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleAnthropicError(response, model);
    }

    const json = (await response.json()) as AnthropicMessageResponse;
    const contentBlocks = json.content;
    
    // Extract text content and tool calls
    let content: string | null = null;
    const toolCalls: any[] = []; // Using any for ToolCall matching Provider.ts interface

    for (const block of contentBlocks) {
      if (block.type === "text") {
        if (content === null) content = "";
        content += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id!,
          type: "function",
          function: {
            name: block.name!,
            arguments: JSON.stringify(block.input)
          }
        });
      }
    }

    const usage = json.usage ? {
      input_tokens: json.usage.input_tokens,
      output_tokens: json.usage.output_tokens,
      total_tokens: json.usage.input_tokens + json.usage.output_tokens,
      cached_tokens: json.usage.cache_read_input_tokens,
      cache_creation_tokens: json.usage.cache_creation_input_tokens,
    } : undefined;

    return { content, usage, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
  }


}
