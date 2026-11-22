import type { ChatStore, MessageUpdate, NewToolCall } from "./Store.js";

/**
 * Changes text before it is saved, such as to mask personal data. Runs after NodeLLM's own
 * masking of keys and tokens.
 */
export type StoreRedactor = (text: string) => string;

// Kept the same as @node-llm/core's utils/redact.ts, which this package can't import while
// it supports older core versions.
/** Key and token formats, masked wherever they appear in text. */
const SECRET_VALUE = new RegExp(
  "(?<![A-Za-z0-9])(?:" +
    [
      "sk-(?:ant-|proj-|or-v1-|svcacct-|admin-)?[A-Za-z0-9_-]{16,256}", // OpenAI, Anthropic, OpenRouter
      "[sr]k_(?:live|test)_[A-Za-z0-9]{16,256}", // Stripe
      "AIza[0-9A-Za-z_-]{30,64}", // Google
      "xai-[A-Za-z0-9]{20,256}", // xAI
      "(?:AKIA|ASIA)[0-9A-Z]{16}", // AWS access key IDs, long-lived and temporary
      "gh[pousr]_[A-Za-z0-9]{30,255}", // GitHub tokens
      "github_pat_[A-Za-z0-9_]{20,255}", // GitHub fine-grained tokens
      "xox[abprs]-[A-Za-z0-9-]{10,255}", // Slack tokens
      "eyJ[A-Za-z0-9_-]{8,4096}\\.eyJ[A-Za-z0-9_-]{8,8192}\\.[A-Za-z0-9_-]{8,4096}" // JWTs
    ].join("|") +
    ")",
  "g"
);

/** The credential after `Bearer` or `Basic`, keeping the scheme so the text still reads. */
const AUTH_SCHEME = /(?<=\b(?:Bearer|Basic)\s{1,4})[A-Za-z0-9._~+/=-]{16,4096}/g;

/** A PEM private key, from its BEGIN line to its END line. */
const PRIVATE_KEY =
  /-----BEGIN [A-Z0-9 ]{0,40}PRIVATE KEY-----[\s\S]{0,16384}?-----END [A-Z0-9 ]{0,40}PRIVATE KEY-----/g;

/** A secret written as `name = value` or `"name": "value"`, such as an AWS secret access key. */
const NAMED_SECRET =
  /((?:aws_secret_access_key|aws_session_token|secret_access_key|secretAccessKey|sessionToken|client_secret|clientSecret|api_key|apiKey|password|passwd)["']?\s{0,4}[:=]\s{0,4}["']?)[^\s"',;&]{8,512}/gi;

/**
 * The password in a URL such as postgres://user:password@host or redis://:password@host. The
 * scheme must start the word, and no part may hold quotes or spaces, so it never spans JSON
 * fields; the password runs to the last `@` before the host.
 */
const URL_PASSWORD =
  /(?<![a-z0-9+.-])([a-z][a-z0-9+.-]{0,30}:\/\/[^\s:/@"'<>\\]{0,256}:)[^\s/"'<>\\]{1,256}@/gi;

/** Masks API keys, tokens, private keys and passwords in URLs, which a conversation should never keep. */
export function maskSecrets(text: string): string {
  return text
    .replace(PRIVATE_KEY, "[REDACTED PRIVATE KEY]")
    .replace(SECRET_VALUE, "[REDACTED]")
    .replace(AUTH_SCHEME, "[REDACTED]")
    .replace(NAMED_SECRET, "$1[REDACTED]")
    .replace(URL_PASSWORD, "$1[REDACTED]@");
}

const REDACTING = Symbol.for("nodellm.orm.redacting");

/**
 * The redactor for a chat or session: `redact`, then the masking of any PIIMaskMiddleware among
 * its middlewares, so what is saved is masked as what the model is sent.
 */
export function redactorFor(
  redact: StoreRedactor | undefined,
  middlewares: unknown[] | undefined
): StoreRedactor | undefined {
  const masks = (middlewares ?? [])
    .filter(
      (middleware): middleware is { mask: (text: string) => string } =>
        typeof middleware === "object" &&
        middleware !== null &&
        (middleware as { name?: unknown }).name === "PIIMask" &&
        typeof (middleware as { mask?: unknown }).mask === "function"
    )
    .map((middleware) => (text: string) => middleware.mask(text));
  const steps = [...(redact ? [redact] : []), ...masks];
  if (steps.length === 0) return undefined;
  return (text) => steps.reduce((current, step) => step(current), text);
}

/** A copy of a value with every string in it cleaned. */
function cleanDeep<T>(value: T, clean: (text: string) => string, depth = 0): T {
  if (typeof value === "string") return clean(value) as T;
  if (depth > 30 || value === null || typeof value !== "object" || value instanceof Date)
    return value;
  if (Array.isArray(value)) return value.map((item) => cleanDeep(item, clean, depth + 1)) as T;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      cleanDeep(item, clean, depth + 1)
    ])
  ) as T;
}

/**
 * A store that masks keys and tokens, then applies `redact`, in everything it saves: message
 * text, reasoning and thinking, tool arguments and results, a chat's instructions and metadata,
 * and a session's inputs. Reads are passed through as they are.
 */
export function redactingStore(store: ChatStore, redact?: StoreRedactor): ChatStore {
  if ((store as { [REDACTING]?: boolean })[REDACTING]) return store;
  const clean = (text: string | null | undefined) =>
    typeof text === "string" ? (redact ? redact(maskSecrets(text)) : maskSecrets(text)) : text;

  const cleanText = (text: string) => (redact ? redact(maskSecrets(text)) : maskSecrets(text));

  const wrapped: ChatStore = Object.create(store);
  wrapped.createChat = (chat) =>
    store.createChat({
      ...chat,
      ...(typeof chat.instructions === "string" ? { instructions: clean(chat.instructions) } : {}),
      ...(chat.metadata !== undefined ? { metadata: cleanDeep(chat.metadata, cleanText) } : {})
    });
  wrapped.createAgentSession = (session) =>
    store.createAgentSession({
      ...session,
      metadata: session.metadata ? cleanDeep(session.metadata, cleanText) : session.metadata
    });
  wrapped.updateAgentSession = (id, changes) =>
    store.updateAgentSession(id, { ...changes, metadata: cleanDeep(changes.metadata, cleanText) });
  wrapped.createMessage = (message) =>
    store.createMessage({ ...message, content: clean(message.content) ?? null });
  wrapped.updateMessage = (id, changes: MessageUpdate) =>
    store.updateMessage(id, {
      ...changes,
      ...("content" in changes ? { content: clean(changes.content) ?? null } : {}),
      ...("contentRaw" in changes ? { contentRaw: clean(changes.contentRaw) ?? null } : {}),
      ...("thinkingText" in changes ? { thinkingText: clean(changes.thinkingText) ?? null } : {}),
      ...("reasoning" in changes ? { reasoning: clean(changes.reasoning) ?? null } : {})
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
