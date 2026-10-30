import { Provider } from "../providers/Provider.js";

/**
 * Whether to ask the provider to cache the request. Only providers that declare
 * `supportsPromptCaching` get the flag, so it never reaches another provider's request body.
 */
export function requestPromptCache(
  provider: Provider,
  model: string,
  enabled: boolean | undefined
): true | undefined {
  return enabled && provider.capabilities?.supportsPromptCaching?.(model) ? true : undefined;
}
