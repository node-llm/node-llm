/**
 * Bedrock Message Mapper
 *
 * Converts NodeLLM messages to Bedrock Converse API format.
 * Handles system messages, tool calls, and content blocks.
 */

import { Message } from "../../chat/Message.js";
import { ToolDefinition } from "../../chat/Tool.js";
import {
  BedrockMessage,
  BedrockContentBlock,
  BedrockConverseRequest,
  BedrockToolConfig
} from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Message Conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a NodeLLM message to Bedrock content blocks.
 */
function messageContentToBlocks(content: Message["content"]): BedrockContentBlock[] {
  if (typeof content === "string") {
    return [{ text: content }];
  }

  if (Array.isArray(content)) {
    const blocks: BedrockContentBlock[] = [];
    for (const part of content) {
      if (part.type === "text") {
        blocks.push({ text: part.text });
      } else if (part.type === "image_url" && part.image_url) {
        // Extract base64 data from data URL
        const match = part.image_url.url.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match && match[1] && match[2]) {
          blocks.push({
            image: {
              format: match[1] as "png" | "jpeg" | "gif" | "webp",
              source: { bytes: match[2] }
            }
          });
        } else {
          // Fallback for unsupported image format
          blocks.push({ text: "[image]" });
        }
      } else {
        // Default to empty text for unsupported types
        blocks.push({ text: "" });
      }
    }
    return blocks;
  }

  return [{ text: "" }];
}

/**
 * Convert NodeLLM messages to Bedrock Converse format.
 * Extracts system messages to the top-level system field.
 */
export function convertMessages(messages: Message[]): {
  messages: BedrockMessage[];
  system?: BedrockContentBlock[];
} {
  const systemBlocks: BedrockContentBlock[] = [];
  const bedrockMessages: BedrockMessage[] = [];

  for (const msg of messages) {
    // System messages go to the top-level system field
    if (msg.role === "system") {
      const content = typeof msg.content === "string" ? msg.content : "";
      systemBlocks.push({ text: content });
      continue;
    }

    // User messages
    if (msg.role === "user") {
      bedrockMessages.push({
        role: "user",
        content: messageContentToBlocks(msg.content)
      });
      continue;
    }

    // Assistant messages (may include tool calls)
    if (msg.role === "assistant") {
      const contentBlocks = messageContentToBlocks(msg.content);

      // Add tool use blocks if present
      if (msg.tool_calls) {
        for (const toolCall of msg.tool_calls) {
          contentBlocks.push({
            toolUse: {
              toolUseId: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments || "{}")
            }
          });
        }
      }

      bedrockMessages.push({
        role: "assistant",
        content: contentBlocks
      });
      continue;
    }

    // Tool result messages
    if (msg.role === "tool") {
      // Tool results are sent as user messages with toolResult content
      bedrockMessages.push({
        role: "user",
        content: [
          {
            toolResult: {
              toolUseId: msg.tool_call_id || "",
              content: [{ text: typeof msg.content === "string" ? msg.content : "" }],
              status: msg.isError ? "error" : "success"
            }
          }
        ]
      });
    }
  }

  return {
    messages: bedrockMessages,
    system: systemBlocks.length > 0 ? systemBlocks : undefined
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert NodeLLM tool definitions to Bedrock tool config.
 */
export function convertTools(tools?: ToolDefinition[]): BedrockToolConfig | undefined {
  if (!tools || tools.length === 0) {
    return undefined;
  }

  return {
    tools: tools.map((tool) => ({
      toolSpec: {
        name: tool.function.name,
        description: tool.function.description,
        inputSchema: {
          json: tool.function.parameters || {}
        }
      }
    }))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a complete Bedrock Converse request from NodeLLM ChatRequest.
 */
export function buildConverseRequest(
  messages: Message[],
  tools?: ToolDefinition[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): BedrockConverseRequest {
  const { messages: bedrockMessages, system } = convertMessages(messages);

  const request: BedrockConverseRequest = {
    messages: bedrockMessages
  };

  if (system) {
    request.system = system;
  }

  const toolConfig = convertTools(tools);
  if (toolConfig) {
    request.toolConfig = toolConfig;
  }

  // Inference config (only add if we have values)
  if (options?.maxTokens || options?.temperature !== undefined) {
    request.inferenceConfig = {};
    if (options.maxTokens) {
      request.inferenceConfig.maxTokens = options.maxTokens;
    }
    if (options.temperature !== undefined) {
      request.inferenceConfig.temperature = options.temperature;
    }
  }

  return request;
}
