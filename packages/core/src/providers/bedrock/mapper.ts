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
import { ThinkingConfig } from "../../providers/Provider.js";

// ─────────────────────────────────────────────────────────────────────────────
// Message Conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a NodeLLM message to Bedrock content blocks.
 */
function messageContentToBlocks(content: Message["content"]): BedrockContentBlock[] {
  if (typeof content === "string") {
    return content ? [{ text: content }] : [];
  }

  if (Array.isArray(content)) {
    const blocks: BedrockContentBlock[] = [];
    for (const part of content) {
      if (part.type === "text") {
        const block: BedrockContentBlock = { text: part.text };
        blocks.push(block);

        if (part.cache_control?.type === "ephemeral") {
          blocks.push({ cachePoint: { type: "default" } });
        }
      } else if (part.type === "image_url" && part.image_url) {
        // Extract base64 data from data URL
        const match = part.image_url.url.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match && match[1] && match[2]) {
          blocks.push({
            image: {
              format: match[1].replace("jpg", "jpeg") as "png" | "jpeg" | "gif" | "webp",
              source: { bytes: match[2] }
            }
          });
        } else {
          // Fallback if not a data URL or missing base64
          blocks.push({ text: `[Image: ${part.image_url.url}]` });
        }
      } else {
        // Default to empty text for unsupported types
        blocks.push({ text: "" });
      }
    }
    return blocks.filter((b) => b.text !== "");
  }

  return [];
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
  let currentToolResults: BedrockContentBlock[] = [];

  const flushToolResults = () => {
    if (currentToolResults.length > 0) {
      bedrockMessages.push({
        role: "user",
        content: currentToolResults
      });
      currentToolResults = [];
    }
  };

  for (const msg of messages) {
    if (msg.role !== "tool") {
      flushToolResults();
    }

    // System messages go to the top-level system field
    if (msg.role === "system") {
      const blocks = messageContentToBlocks(msg.content);
      systemBlocks.push(...blocks);
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

    // Assistant messages (may include tool calls and reasoning)
    if (msg.role === "assistant") {
      const contentBlocks = messageContentToBlocks(msg.content);

      // Add reasoning content if present
      if (msg.reasoning) {
        contentBlocks.unshift({
          reasoningContent: {
            text: msg.reasoning
          }
        });
      }

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
      currentToolResults.push({
        toolResult: {
          toolUseId: msg.tool_call_id || "",
          content: [{ text: typeof msg.content === "string" ? msg.content : "" }],
          status: msg.isError ? "error" : "success"
        }
      });
    }
  }

  flushToolResults();

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
    thinking?: ThinkingConfig;
    guardrail?: {
      guardrailIdentifier: string;
      guardrailVersion: string;
      trace?: "enabled" | "disabled";
    };
    additionalModelRequestFields?: Record<string, any>;
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

  if (options?.guardrail) {
    request.guardrailConfig = options.guardrail;
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

  // Thinking config for Claude 3.7+
  if (options?.thinking?.budget) {
    request.additionalModelRequestFields = {
      ...request.additionalModelRequestFields,
      thinking: {
        type: "enabled",
        budget_tokens: options.thinking.budget
      }
    };
  }

  // Merge any other additional fields
  if (options?.additionalModelRequestFields) {
    request.additionalModelRequestFields = {
      ...request.additionalModelRequestFields,
      ...options.additionalModelRequestFields
    };
  }

  return request;
}
