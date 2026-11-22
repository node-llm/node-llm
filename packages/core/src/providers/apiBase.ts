import { ConfigurationError } from "../errors/index.js";
import { registerCustomApiBase, type ApiBaseSecurity } from "../utils/ApiBaseGuard.js";

/** Endpoint paths NodeLLM adds to an OpenAI-compatible base URL itself. */
export const OPENAI_COMPATIBLE_ENDPOINTS =
  /\/(?:chat\/completions|completions|responses|embeddings)$/;

/**
 * Returns the base URL as given, or undefined when none is set.
 *
 * Throws a ConfigurationError when the URL has no http(s) scheme or ends in an
 * endpoint path NodeLLM adds itself (such as /chat/completions), so a
 * misconfigured base fails at setup with a clear message instead of a 404 on
 * the first request.
 *
 * A base URL that is set is remembered, so every request to it is checked: cloud metadata
 * addresses are refused, and private ones too with `security.blockPrivateNetwork`, on every
 * connection, and redirects to another host are refused.
 */
export function checkApiBase(
  setting: string,
  value: string | undefined,
  options: { example: string; endpoints?: RegExp; security?: ApiBaseSecurity }
): string | undefined {
  if (value === undefined || value === "") return undefined;

  const path = value.replace(/[?#].*$/, "").replace(/\/+$/, "");
  const endpoint = options.endpoints ? path.match(options.endpoints)?.[0] : undefined;

  if (/^https?:\/\/[^/?#]/i.test(value) && !endpoint) {
    registerCustomApiBase(value.replace(/[?#].*$/, ""), options.security);
    return value;
  }

  const hint = endpoint ? ` (without ${endpoint})` : ", starting with http:// or https://";
  throw new ConfigurationError(
    `${setting} should look like ${options.example}${hint}, got ${JSON.stringify(value)}`
  );
}
