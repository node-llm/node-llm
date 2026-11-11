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
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number,
  { coverBody = true }: FetchTimeoutOptions = {}
): Promise<Response> {
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, options);
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

    const response = await fetch(url, {
      ...options,
      signal: mergedSignal
    });
    if (!coverBody) clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) throw timeoutError;
    throw error;
  }
}
