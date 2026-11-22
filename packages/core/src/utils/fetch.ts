import { NetworkError } from "../errors/index.js";
import { redactSecrets } from "./redact.js";
import { apiBaseRulesFor, fetchApiBase } from "./ApiBaseGuard.js";

export interface FetchTimeoutOptions {
  /**
   * Whether the timeout also covers reading the response body (the default).
   * Streams pass false: they may run longer than one request should take.
   */
  coverBody?: boolean;
}

/**
 * Fetch with timeout support.
 * Wraps the standard fetch API with an AbortController to enforce request timeouts.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeoutMs - Timeout in milliseconds (optional)
 * @param timeoutOptions - Whether the timeout covers the body read
 * @returns Promise<Response>
 * @throws Error if the request times out
 * @throws NetworkError if the provider can't be reached
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number,
  { coverBody = true }: FetchTimeoutOptions = {}
): Promise<Response> {
  // A custom base URL is checked on every connection and redirect; a default URL isn't.
  const rules = apiBaseRulesFor(url);
  const send = (init: RequestInit) => (rules ? fetchApiBase(url, init, rules) : fetch(url, init));

  if (!timeoutMs || timeoutMs <= 0) {
    try {
      return await send(options);
    } catch (error) {
      throw networkError(error, url);
    }
  }

  const userSignal = options.signal;
  const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
  const controller = new AbortController();
  // Kept running after the headers arrive: some providers send headers at once and then hold the
  // body open, so a timer cleared on headers would never fire. Unref'd, and aborting a finished
  // request does nothing, so it needs no clearing once the body is read.
  const timeoutId = setTimeout(() => controller.abort(timeoutError), timeoutMs);
  if (timeoutId.unref) timeoutId.unref();

  try {
    const mergedSignal = userSignal
      ? AbortSignal.any([userSignal, controller.signal])
      : controller.signal;

    const response = await send({
      ...options,
      signal: mergedSignal
    });
    if (!coverBody) clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) throw timeoutError;
    throw networkError(error, url);
  }
}

/**
 * fetch() rejects with a TypeError ("fetch failed") when it can't reach the server, with the
 * reason, such as ECONNRESET, in its cause. Anything else, such as a cancellation, is left as is.
 */
function networkError(error: unknown, url: string): unknown {
  if (!(error instanceof TypeError)) return error;
  let host: string | undefined;
  try {
    host = new URL(url).host;
  } catch {
    host = undefined;
  }
  const cause = (error as { cause?: { code?: string; message?: string } }).cause;
  const reason = cause?.code ?? cause?.message;
  return new NetworkError(
    redactSecrets(
      `Could not reach ${host ?? "the provider"}: ${error.message}${reason ? ` (${reason})` : ""}`
    ),
    host,
    { cause: error }
  );
}
