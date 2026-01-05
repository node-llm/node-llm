// @ts-expect-error - Node.js requires 'assert', TypeScript wants 'with'
import aliases from "./aliases.json" assert { type: "json" };
import { logger } from "./utils/logger.js";

export type ProviderName = "openai" | "anthropic" | "gemini" | "vertexai" | "openrouter" | "mistral" | "deepseek" | "bedrock" | string;

export function resolveModelAlias(alias: string, provider?: ProviderName): string {
  if (!provider) {
    return alias;
  }

  const aliasEntry = (aliases as Record<string, Record<string, string>>)[alias];
  
  if (aliasEntry) {
    if (aliasEntry[provider.toLowerCase()]) {
      const resolved = aliasEntry[provider.toLowerCase()] as string;
      logger.debug(`Resolved model alias '${alias}' → '${resolved}' for provider '${provider}'`);
      return resolved;
    }
  }

  logger.debug(`No alias mapping found for '${alias}' with provider '${provider}', using as-is`);
  return alias;
}
