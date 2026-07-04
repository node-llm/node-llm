import { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import { NodeLLMCore } from "@node-llm/core";

export type MCPSamplingParams = CreateMessageRequest["params"];

/**
 * Handles a `sampling/createMessage` request from an MCP server and returns
 * the completion the server asked for.
 */
export type MCPSamplingHandler = (
  request: MCPSamplingParams
) => Promise<CreateMessageResult> | CreateMessageResult;

/**
 * Convenience form: let NodeLLM answer sampling requests using an existing
 * LLM instance instead of writing a handler by hand.
 */
export interface MCPSamplingLLMOptions {
  llm: NodeLLMCore;
  /** Model to use for sampling. Falls back to the llm's configured defaultChatModel. */
  model?: string;
}

export type MCPSamplingOption = MCPSamplingHandler | MCPSamplingLLMOptions;

export function resolveSamplingHandler(option?: MCPSamplingOption): MCPSamplingHandler | undefined {
  if (!option) return undefined;
  if (typeof option === "function") return option;
  return createLLMSamplingHandler(option.llm, option.model);
}

/**
 * Extracts plain text from a sampling message's content, which per the MCP
 * spec can be a single content block or (for tool-augmented sampling) an
 * array of blocks. Non-text blocks (images/audio/tool use) are ignored —
 * multimodal sampling is not yet supported.
 */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((block): block is { type: "text"; text: string } => block?.type === "text")
      .map((block) => block.text)
      .join("\n");
  }
  if (content && typeof content === "object" && (content as { type?: string }).type === "text") {
    return (content as { text: string }).text;
  }
  return "";
}

function mapFinishReason(reason?: string | null): CreateMessageResult["stopReason"] {
  switch (reason) {
    case "stop":
    case "end_turn":
      return "endTurn";
    case "length":
    case "max_tokens":
      return "maxTokens";
    default:
      return undefined;
  }
}

/**
 * Builds a sampling handler backed by a NodeLLM instance: incoming
 * `sampling/createMessage` requests are replayed as a NodeLLM chat and the
 * result is mapped back into the shape the MCP server expects.
 */
export function createLLMSamplingHandler(
  llm: NodeLLMCore,
  defaultModel?: string
): MCPSamplingHandler {
  return async (request: MCPSamplingParams): Promise<CreateMessageResult> => {
    const model = defaultModel ?? llm.defaultChatModel;
    if (!model) {
      throw new Error(
        "[MCP] Sampling requires a model. Pass { sampling: { llm, model } } or set " +
          "defaultChatModel in your NodeLLM config."
      );
    }

    const chat = llm.chat(model, { maxTokens: request.maxTokens });

    if (request.systemPrompt) {
      chat.withInstructions(request.systemPrompt);
    }
    if (typeof request.temperature === "number") {
      chat.withTemperature(request.temperature);
    }

    const messages = request.messages ?? [];
    const lastMessage = messages[messages.length - 1];

    for (const message of messages.slice(0, -1)) {
      chat.add(message.role, extractText(message.content));
    }

    const response = await chat.ask(lastMessage ? extractText(lastMessage.content) : "");

    return {
      model: response.model ?? model,
      role: "assistant",
      content: { type: "text", text: response.toString() },
      stopReason: mapFinishReason(response.finish_reason)
    };
  };
}
