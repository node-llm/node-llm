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
  // If no timeout is specified, use standard fetch
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (timeoutId.unref) timeoutId.unref();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Check if the error was due to abort (timeout)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    
    throw error;
  }
}
