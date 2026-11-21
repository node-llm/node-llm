import { Message } from "./Message.js";

/**
 * A tool the model must call before it ends its turn, such as one that reports a result. A name,
 * or the name with the reminder sent when the model ends its turn without calling it.
 */
export type EndWith = string | { tool: string; reminder?: string };

export function endWithTool(
  endWith: EndWith | null | undefined
): { tool: string; reminder: string } | undefined {
  if (!endWith) return undefined;
  const tool = typeof endWith === "string" ? endWith : endWith.tool;
  const reminder =
    (typeof endWith === "string" ? undefined : endWith.reminder) ??
    `You ended your turn without calling the ${tool} tool. Call ${tool} now.`;
  return { tool, reminder };
}

/** Whether the model called the tool in any message from `from` on. */
export function calledTool(messages: Message[], from: number, tool: string): boolean {
  return messages
    .slice(from)
    .some((message) => message.tool_calls?.some((call) => call.function.name === tool));
}
