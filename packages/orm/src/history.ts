import type { Message } from "@node-llm/core";
import type { StoredMessage, StoredToolCall } from "./Store.js";

/**
 * The chat history to give an agent from what the store recorded. Each assistant message is
 * preceded by the tool calls it made, with their results, so the model sees what it did. A call
 * with no result, whose run stopped before it finished, is left out with its message's empty
 * text, so the history stays valid and the run can be asked to continue.
 */
export function storedHistory(
  messages: StoredMessage[],
  toolCalls: StoredToolCall[] = []
): Message[] {
  const callsByMessage = new Map<string, StoredToolCall[]>();
  for (const call of toolCalls) {
    if (call.result === null || call.result === undefined) continue;
    callsByMessage.set(call.messageId, [...(callsByMessage.get(call.messageId) ?? []), call]);
  }

  const history: Message[] = [];
  for (const message of messages) {
    const role = message.role as Message["role"];
    if (role !== "assistant") {
      history.push({ role, content: message.content || "" });
      continue;
    }

    const calls = callsByMessage.get(message.id) ?? [];
    if (calls.length > 0) {
      history.push({
        role: "assistant",
        content: null,
        tool_calls: calls.map((call) => ({
          id: call.toolCallId,
          type: "function" as const,
          function: { name: call.name, arguments: call.arguments },
          ...(call.thoughtSignature ? { thought_signature: call.thoughtSignature } : {})
        }))
      });
      for (const call of calls) {
        history.push({ role: "tool", tool_call_id: call.toolCallId, content: call.result! });
      }
    }
    // Providers reject an empty assistant message, such as one whose run never finished.
    if (message.content) history.push({ role: "assistant", content: message.content });
  }
  return history;
}
