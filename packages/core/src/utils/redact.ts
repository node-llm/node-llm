// Masking of keys and tokens in what NodeLLM prints, saves or puts on its errors. No imports, so
// errors and the logger can both use it. Every pattern is bounded and starts at a fixed prefix,
// so a long string can't make it slow (no catastrophic backtracking).

/** Field names whose string values are secrets, wherever they appear in a body. */
const SECRET_KEY =
  /(?:api[-_]?key|secret|passw(?:or)?d|private[-_]?key|access[-_]?key|credential|authorization|cookie|bearer|token$)/i;

/** Key and token formats, masked wherever they appear in text. */
export const SECRET_VALUE = new RegExp(
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

const DATA_URI = /data:([\w/+.-]{1,100});base64,[A-Za-z0-9+/=]{200,}/g;
const BASE64_ONLY = /^[A-Za-z0-9+/=\r\n]+$/;

/** Masks keys, tokens, private keys and passwords in URLs in a piece of text. */
export function redactSecrets(text: string): string {
  return text
    .replace(PRIVATE_KEY, "[REDACTED PRIVATE KEY]")
    .replace(SECRET_VALUE, "[REDACTED]")
    .replace(AUTH_SCHEME, "[REDACTED]")
    .replace(NAMED_SECRET, "$1[REDACTED]")
    .replace(URL_PASSWORD, "$1[REDACTED]@");
}

/**
 * A copy of a request or response body that is safe to print: keys and tokens are masked, and
 * base64 files (images, PDFs, audio, in any field) are replaced by their size. Prompts and
 * answers stay, since seeing them is the point of debug logging.
 */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    if (value.length >= 200 && BASE64_ONLY.test(value)) return `[${value.length} chars of base64]`;
    return redactSecrets(value).replace(
      DATA_URI,
      (match, mime) => `data:${mime};base64,[${match.length} chars]`
    );
  }
  if (depth > 20 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactForLog(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SECRET_KEY.test(key) && typeof item === "string"
        ? "[REDACTED]"
        : redactForLog(item, depth + 1)
    ])
  );
}
