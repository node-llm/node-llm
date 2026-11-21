import { Usage } from "../providers/Provider.js";

/** Adds one usage into another: tokens, cache tokens and costs. */
export function addUsage(total: Usage, usage: Usage): void {
  total.input_tokens += usage.input_tokens ?? 0;
  total.output_tokens += usage.output_tokens ?? 0;
  total.total_tokens += usage.total_tokens ?? 0;
  if (usage.cached_tokens) total.cached_tokens = (total.cached_tokens ?? 0) + usage.cached_tokens;
  if (usage.cache_creation_tokens)
    total.cache_creation_tokens = (total.cache_creation_tokens ?? 0) + usage.cache_creation_tokens;
  if (usage.cost !== undefined) total.cost = (total.cost ?? 0) + usage.cost;
  if (usage.input_cost !== undefined) total.input_cost = (total.input_cost ?? 0) + usage.input_cost;
  if (usage.output_cost !== undefined)
    total.output_cost = (total.output_cost ?? 0) + usage.output_cost;
}

/**
 * Usage from calls made outside a chat's own requests, such as a tool asking another model about
 * an image. Kept for the chat's total, and added to the ask running now, if any, so its cost limit
 * counts it.
 */
export class SideUsage {
  readonly counted: Usage[] = [];
  /** The usage of the ask running now */
  current?: Usage;

  count(usage: Usage): void {
    this.counted.push(usage);
    if (this.current) addUsage(this.current, usage);
  }
}
