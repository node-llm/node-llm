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

const SECRET_VALUE =
  /\b(?:sk-(?:ant-|proj-|or-v1-)?[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|Bearer\s+[A-Za-z0-9._~+/=-]{16,})/g;

/** Masks key- and token-like values in an MCP server's error before the model sees it. */
export function maskSecrets(text: string): string {
  return text.replace(SECRET_VALUE, "[REDACTED]");
}
