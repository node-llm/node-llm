import type { ChatStore, MessageUpdate, NewToolCall } from "./Store.js";

/**
 * Changes text before it is saved, such as to mask personal data. Runs after NodeLLM's own
 * masking of keys and tokens.
 */
export type StoreRedactor = (text: string) => string;

const SECRET_VALUE =
  /\b(?:sk-(?:ant-|proj-|or-v1-)?[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|xai-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|Bearer\s+[A-Za-z0-9._~+/=-]{16,})/g;
// The password in a URL such as postgres://user:password@host.
const URL_PASSWORD = /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@/]+@/gi;

/** Masks API keys, tokens and passwords in URLs, which a conversation should never keep. */
export function maskSecrets(text: string): string {
  return text.replace(SECRET_VALUE, "[REDACTED]").replace(URL_PASSWORD, "$1[REDACTED]@");
}

const REDACTING = Symbol.for("nodellm.orm.redacting");

/**
 * A store that masks keys and tokens, then applies `redact`, in everything it saves: message
 * text, thinking, tool arguments and tool results. Reads are passed through as they are.
 */
export function redactingStore(store: ChatStore, redact?: StoreRedactor): ChatStore {
  if ((store as { [REDACTING]?: boolean })[REDACTING]) return store;
  const clean = (text: string | null | undefined) =>
    typeof text === "string" ? (redact ? redact(maskSecrets(text)) : maskSecrets(text)) : text;

  const wrapped: ChatStore = Object.create(store);
  wrapped.createMessage = (message) =>
    store.createMessage({ ...message, content: clean(message.content) ?? null });
  wrapped.updateMessage = (id, changes: MessageUpdate) =>
    store.updateMessage(id, {
      ...changes,
      ...("content" in changes ? { content: clean(changes.content) ?? null } : {}),
      ...("contentRaw" in changes ? { contentRaw: clean(changes.contentRaw) ?? null } : {}),
      ...("thinkingText" in changes ? { thinkingText: clean(changes.thinkingText) ?? null } : {})
    });
  wrapped.createToolCall = (toolCall: NewToolCall) =>
    store.createToolCall({
      ...toolCall,
      arguments: clean(toolCall.arguments) ?? "",
      ...("thought" in toolCall ? { thought: clean(toolCall.thought) ?? null } : {})
    });
  wrapped.finishToolCall = (messageId, toolCallId, finished) =>
    store.finishToolCall(messageId, toolCallId, {
      ...finished,
      result: clean(finished.result) ?? "",
      ...("thought" in finished ? { thought: clean(finished.thought) ?? null } : {})
    });
  // Methods the app's store has beyond ChatStore keep working through the prototype.
  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(store))) {
    const value = (store as unknown as Record<string, unknown>)[name];
    if (
      name !== "constructor" &&
      typeof value === "function" &&
      !(name in wrapped && Object.hasOwn(wrapped, name))
    ) {
      (wrapped as unknown as Record<string, unknown>)[name] = value.bind(store);
    }
  }
  Object.defineProperty(wrapped, REDACTING, { value: true });
  return wrapped;
}
