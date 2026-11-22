/**
 * Characters that render as nothing or reorder text: zero-width characters, bidirectional
 * controls and Unicode tag characters. A server can hide instructions for the model in a tool's
 * description with them, where a person reviewing the tool can't see them. They have no use in
 * tool names, descriptions or schemas, so they are removed.
 */
const INVISIBLE =
  /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]|\uDB40[\uDC00-\uDC7F]/g;

export function stripInvisible(text: string): string {
  return text.replace(INVISIBLE, "");
}

/** A copy of a schema or metadata object with invisible characters removed from every string. */
export function stripInvisibleDeep<T>(value: T, depth = 0): T {
  if (typeof value === "string") return stripInvisible(value) as T;
  if (depth > 30 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => stripInvisibleDeep(item, depth + 1)) as T;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      stripInvisible(key),
      stripInvisibleDeep(item, depth + 1)
    ])
  ) as T;
}

// Kept the same as @node-llm/core's utils/redact.ts.
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

/** Masks key- and token-like values in an MCP server's error before the model sees it. */
export function maskSecrets(text: string): string {
  return text
    .replace(PRIVATE_KEY, "[REDACTED PRIVATE KEY]")
    .replace(SECRET_VALUE, "[REDACTED]")
    .replace(AUTH_SCHEME, "[REDACTED]")
    .replace(NAMED_SECRET, "$1[REDACTED]")
    .replace(URL_PASSWORD, "$1[REDACTED]@");
}
