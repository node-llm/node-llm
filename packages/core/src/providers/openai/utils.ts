/**
 * Builds a URL by appending an endpoint to a base URL.
 * Handles query parameters correctly by inserting the endpoint before the query string.
 * 
 * @param baseUrl - The base URL (may include query parameters)
 * @param endpoint - The endpoint path to append (e.g., '/chat/completions')
 * @returns The complete URL
 * 
 * @example
 * // Standard URL
 * buildUrl('https://api.openai.com/v1', '/chat/completions')
 * // => 'https://api.openai.com/v1/chat/completions'
 * 
 * @example
 * // URL with query params (Azure)
 * buildUrl('https://resource.azure.com/openai/deployments/gpt-4?api-version=2024-08-01', '/chat/completions')
 * // => 'https://resource.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-08-01'
 */
export function buildUrl(baseUrl: string, endpoint: string): string {
  if (baseUrl.includes('?')) {
    const [basePath, queryString] = baseUrl.split('?');
    return `${basePath}${endpoint}?${queryString}`;
  }
  return `${baseUrl}${endpoint}`;
}
