import { Message } from "../../chat/Message.js";
import { ContentPart } from "../../chat/Content.js";
import { ThinkingConfig } from "../Provider.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";
import { AnthropicMessage, AnthropicContentBlock, AnthropicMessageRequest } from "./types.js";

export function formatSystemPrompt(messages: Message[]): string | undefined {
  let systemPrompt: string | undefined;
  for (const msg of messages) {
    if (msg.role === "system" || msg.role === "developer") {
      if (typeof msg.content === "string") {
        systemPrompt = msg.content;
      } else if (Array.isArray(msg.content)) {
        systemPrompt = msg.content
          .filter((p): p is ContentPart & { type: "text" } => p.type === "text")
          .map((p) => p.text)
          .join("\n");
      } else if (msg.content) {
        systemPrompt = String(msg.content);
      }
    }
  }
  return systemPrompt;
}

export function formatMessages(requestMessages: Message[]): AnthropicMessage[] {
  const messages: AnthropicMessage[] = [];

  for (const msg of requestMessages) {
    if (msg.role === "system" || msg.role === "developer") continue;

    const formatted = formatSingleMessage(msg);
    const lastMsg = messages[messages.length - 1];

    if (lastMsg && lastMsg.role === formatted.role) {
      // Merge content
      const existingContent = Array.isArray(lastMsg.content)
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
  return messages;
}

function formatSingleMessage(msg: Message): AnthropicMessage {
  const role: "user" | "assistant" = msg.role === "user" ? "user" : "assistant";

  // Handle Tool Responses (role: "tool")
  if (msg.role === "tool") {
    return {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: msg.tool_call_id!,
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
          is_error: msg.isError
        }
      ]
    };
  }

  // Handle Assistant Messages (which might have tool_calls)
  if (msg.role === "assistant" && msg.tool_calls) {
    const blocks: AnthropicContentBlock[] = [];

    // Assistant text content
    const text = String(msg.content || "");
    if (text.length > 0) {
      blocks.push({ type: "text", text });
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

  const contentText = String(msg.content || "");

  if (contentText && typeof msg.content === "string") {
    return { role, content: contentText };
  }

  if (contentText && msg.content instanceof String) {
    return { role, content: contentText };
  }

  // Handle multimodal content (images)
  const blocks: AnthropicContentBlock[] = [];
  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part.type === "text") {
        blocks.push({ type: "text", text: part.text });
      } else if (part.type === "image_url") {
        const url = part.image_url.url;
        if (url.startsWith("data:")) {
          const parts = url.split(",");
          const meta = parts[0];
          const data = parts.slice(1).join(",");

          if (meta && data) {
            const mimeMatch = meta.match(/:(.*?);/);
            const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";

            if (mediaType === "application/pdf") {
              blocks.push({
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: data
                }
              });
            } else {
              blocks.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: data
                }
              });
            }
          }
        }
      }
    }
  }
  return { role, content: blocks };
}

/**
 * Add the thinking fields for a ThinkingConfig to a request body.
 * Call after tool_choice is set.
 *
 * - `budget` is sent as a fixed thinking budget, exactly as given.
 * - On generations that only think adaptively (no budget option in the registry:
 *   Opus 4.7+, Sonnet 5+, Fable), `effort` turns on adaptive thinking and is sent
 *   as `output_config.effort`. Forced tool choice skips the thinking block, which
 *   the API rejects alongside it.
 * - On generations that take a budget, `effort` alone is not sent, so calls that
 *   worked before keep the same request.
 * - `display` is forwarded on the thinking block, and alone turns on adaptive thinking.
 */
export function applyThinking(
  body: AnthropicMessageRequest,
  thinking: ThinkingConfig | undefined,
  maxTokensSet: boolean
): void {
  if (!thinking) return;

  const options = ModelRegistry.getReasoningOptions(body.model, "anthropic");
  const takesEffort = options.some((option) => option.type === "effort");
  const adaptiveOnly = takesEffort && !options.some((option) => option.type === "budget_tokens");
  const effort = thinking.effort && thinking.effort !== "none" ? thinking.effort : undefined;
  const display = thinking.display ? { display: thinking.display } : {};
  const forcedTool = body.tool_choice?.type === "any" || body.tool_choice?.type === "tool";

  if (thinking.budget) {
    body.thinking = { type: "enabled", budget_tokens: thinking.budget, ...display };
    // Extended thinking models require a larger max_tokens
    if (!maxTokensSet) {
      body.max_tokens = Math.max(body.max_tokens, thinking.budget + 1024);
    }
  } else if (thinking.display || (effort && adaptiveOnly && !forcedTool)) {
    body.thinking = { type: "adaptive", ...display };
  }

  if (effort && takesEffort && (thinking.budget || adaptiveOnly)) {
    body.output_config = { ...body.output_config, effort };
  }
}
