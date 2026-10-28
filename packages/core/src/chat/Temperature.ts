import { Provider } from "../providers/Provider.js";
import { logger } from "../utils/logger.js";

const warnedModels = new Set<string>();

/**
 * The temperature to send. Models that reject one (such as Claude Opus 4.7 and later) get none,
 * so a chat or agent configured with a temperature keeps working when it moves to them.
 */
export function requestTemperature(
  provider: Provider,
  model: string,
  temperature: number | undefined
): number | undefined {
  if (temperature === undefined) return undefined;
  if (provider.capabilities?.supportsTemperature?.(model) !== false) return temperature;

  if (!warnedModels.has(model)) {
    warnedModels.add(model);
    logger.warn(`Model ${model} does not accept a temperature; sending the request without it.`);
  }
  return undefined;
}
