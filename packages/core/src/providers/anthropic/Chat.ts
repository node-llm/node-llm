import { ChatRequest, ChatResponse } from "../Provider.js";
import { AnthropicMessageRequest, AnthropicMessage, AnthropicContentBlock, AnthropicMessageResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleAnthropicError } from "./Errors.js";
import { Message } from "../../chat/Message.js";
import { ContentPart } from "../../chat/Content.js";

export class AnthropicChat {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model;
    const maxTokens = request.max_tokens || Capabilities.getMaxOutputTokens(model) || 4096;

    // Separate system message from the rest
    let systemPrompt: string | undefined;
    const messages: AnthropicMessage[] = [];

    for (const msg of request.messages) {
      if (msg.role === "system") {
        if (typeof msg.content === "string") {
          systemPrompt = msg.content;
        } else if (Array.isArray(msg.content)) {
          systemPrompt = msg.content
            .filter((p): p is ContentPart & { type: "text" } => p.type === "text")
            .map(p => p.text)
            .join("\n");
        } else if (msg.content) {
            systemPrompt = String(msg.content);
        }
      } else {
        const formatted = this.formatMessage(msg);
        const lastMsg = messages[messages.length - 1];

        if (lastMsg && lastMsg.role === formatted.role) {
          // Merge content
          let existingContent = Array.isArray(lastMsg.content) 
            ? lastMsg.content 
            : [{ type: "text", text: lastMsg.content } as AnthropicContentBlock];
          
          const newContent = Array.isArray(formatted.content)
            ? formatted.content
            : [{ type: "text", text: formatted.content } as AnthropicContentBlock];
            
          lastMsg.content = [...existingContent, ...newContent];
        } else {
          messages.push(formatted);
        }
      }
    }

    const body: AnthropicMessageRequest = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      system: systemPrompt,
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

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        ...request.headers,
      },
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
    } : undefined;

    return { content, usage, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
  }

  private formatMessage(msg: Message): AnthropicMessage {
    const role: "user" | "assistant" = msg.role === "user" ? "user" : "assistant";

    // Handle Tool Responses (role: "tool")
    // Anthropic expects tool results to be in specific "user" messages with type "tool_result"
    if (msg.role === "tool") {
      // In Anthropic API, tool results are part of the 'user' turn.
      // But node-llm treats them as distinct messages.
      // WE MUST return a USER role message here.
      // The content must be a block of type tool_result.
      return {
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: msg.tool_call_id!,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
        }]
      };
    }

    // Handle Assistant Messages (which might have tool_calls)
    if (msg.role === "assistant" && msg.tool_calls) {
        const blocks: AnthropicContentBlock[] = [];
        
        // Assistant text content
        if (msg.content) {
            blocks.push({ type: "text", text: String(msg.content) });
        }

        // Assistant tool uses
        for (const toolCall of msg.tool_calls) {
            blocks.push({
                type: "tool_use",
                id: toolCall.id,
                name: toolCall.function.name,
                input: JSON.parse(toolCall.function.arguments)
            });
        }
        return { role: "assistant", content: blocks };
    }

    if (!msg.content) {
        return { role, content: "" };
    }

    if (typeof msg.content === "string") {
      return { role, content: msg.content };
    }
    
    if (msg.content instanceof String) {
        return { role, content: String(msg.content) };
    }
    
    // Handle multimodal content (images)
    const blocks: AnthropicContentBlock[] = [];
    if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
            if (part.type === "text") {
                blocks.push({ type: "text", text: part.text });
            } 
            else if (part.type === "image_url") {
                const url = part.image_url.url;
                if (url.startsWith("data:")) {
                    const parts = url.split(",");
                    const meta = parts[0];
                    const data = parts.slice(1).join(",");

                    if (meta && data) {
                      const mimeMatch = meta.match(/:(.*?);/);
                      const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";
                      
                      blocks.push({
                          type: "image",
                          source: {
                              type: "base64",
                              media_type: mediaType || "image/jpeg",
                              data: data
                          }
                      });
                    }
                } else {
                     // Remote URL handling would go here if supported/pollyfilled
                }
            }
        }
    }
    return { role, content: blocks };
  }
}
