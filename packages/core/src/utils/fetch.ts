/**
 * Fetch with timeout support.
 * Wraps the standard fetch API with an AbortController to enforce request timeouts.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeoutMs - Timeout in milliseconds (optional)
 * @returns Promise<Response>
 * @throws Error if the request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  const userSignal = options.signal;

  // If no timeout is specified and no user signal, use standard fetch
  if ((!timeoutMs || timeoutMs <= 0) && !userSignal) {
    return fetch(url, options);
  }

  // If only user signal (no timeout), use it directly
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (timeoutId.unref) timeoutId.unref();

  try {
    // Merge user signal with timeout signal
    const mergedSignal = userSignal
      ? AbortSignal.any([userSignal, controller.signal])
      : controller.signal;

    const response = await fetch(url, {
      ...options,
      signal: mergedSignal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Check if the error was due to timeout abort
    const isAbortError = error instanceof Error && error.name === "AbortError";
    if (isAbortError && controller.signal.aborted) {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }

    throw error;
  }
}
