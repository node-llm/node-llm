import { TOOL_SEARCH_NAME } from "./ToolSearch.js";
import type { Message } from "./Message.js";

/** What a tool result outside the window is replaced with in a request. */
export const OMITTED_TOOL_RESULT =
  "[Earlier tool result left out to save tokens; only the most recent results are sent in full]";

/**
 * Keeps the most recent tool results in full in the messages sent to the provider, replacing
 * older ones with a short placeholder. Long tool loops (an agent reading pages, files or search
 * results) otherwise resend every earlier result on every request.
 *
 * Results are left out in blocks of `keep`: between `keep` and twice that stay in full, and once
 * there are twice as many, the oldest `keep` are replaced together. The start of the conversation
 * then changes only every `keep` requests, so prompt caching still works in between. Each result
 * keeps its place and tool call id, so the conversation stays valid, and the chat's own history
 * is left untouched.
 */
export function windowToolResults(messages: Message[], keep: number | undefined): Message[] {
  if (keep === undefined || keep < 0) return messages;

  // tool_search results stay: they are small, and they record which deferred
  // tools the conversation has loaded.
  const searchCalls = new Set(
    messages.flatMap((message) =>
      (message.tool_calls ?? [])
        .filter((call) => call.function.name === TOOL_SEARCH_NAME)
        .map((call) => call.id)
    )
  );
  const toolResults = messages.flatMap((message, index) =>
    message.role === "tool" && !searchCalls.has(message.tool_call_id!) ? [index] : []
  );
  const omittedCount =
    keep === 0
      ? toolResults.length
      : Math.floor(Math.max(toolResults.length - keep, 0) / keep) * keep;
  const omitted = new Set(toolResults.slice(0, omittedCount));
  if (omitted.size === 0) return messages;

  return messages.map((message, index) =>
    omitted.has(index) ? { ...message, content: OMITTED_TOOL_RESULT } : message
  );
}
