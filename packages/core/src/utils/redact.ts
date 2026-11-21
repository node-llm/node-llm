// Masking of keys and tokens in what NodeLLM prints or puts on its errors. No imports, so errors
// and the logger can both use it.

const SECRET_KEY =
  /^(?:api[-_]?key|x-api-key|x-goog-api-key|authorization|proxy-authorization|password|secret|client[-_]?secret|access[-_]?token|refresh[-_]?token|id[-_]?token|session[-_]?token|aws[-_]?secret[-_]?access[-_]?key|cookie|set-cookie)$/i;
export const SECRET_VALUE =
  /\b(?:sk-(?:ant-|proj-|or-v1-)?[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|xai-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|Bearer\s+[A-Za-z0-9._~+/=-]{16,})/g;
const DATA_URI = /data:([\w/+.-]+);base64,[A-Za-z0-9+/=]{200,}/g;

/**
 * A copy of a request or response body that is safe to print: keys and tokens are masked, and
 * base64 files (images, PDFs, audio) are replaced by their size. Prompts and answers stay, since
 * seeing them is the point of debug logging.
 */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return value
      .replace(SECRET_VALUE, "[REDACTED]")
      .replace(DATA_URI, (match, mime) => `data:${mime};base64,[${match.length} chars]`);
  }
  if (depth > 20 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactForLog(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SECRET_KEY.test(key) && typeof item === "string"
        ? "[REDACTED]"
        : key === "data" &&
            typeof item === "string" &&
            item.length >= 200 &&
            /^[A-Za-z0-9+/=]+$/.test(item)
          ? `[${item.length} chars of base64]`
          : redactForLog(item, depth + 1)
    ])
  );
}

/** Masks key- and token-like values in a provider's error message. */
export function redactSecrets(text: string): string {
  return text.replace(SECRET_VALUE, "[REDACTED]");
}
