import { AsyncLocalStorage } from "node:async_hooks";
import { Usage } from "../providers/Provider.js";

/**
 * The ask running now, so a subagent started from one of its tools knows its parent: how deep
 * it is, the usage to add its own to, and the parent's cost limit.
 */
export interface AskFrame {
  depth: number;
  /** The ask's running usage, set once its first request starts */
  usage?: Usage;
  maxCost?: number;
  parent?: AskFrame;
}

export const askFrames = new AsyncLocalStorage<AskFrame>();

/** How deep subagents may nest: an agent's tool may start an agent, and so on, this many times. */
export const MAX_AGENT_DEPTH = 8;

/** Adds a subagent's request usage to every ask above it, so their totals and limits include it. */
export function addToParents(frame: AskFrame | undefined, usage: Usage): void {
  for (let parent = frame?.parent; parent; parent = parent.parent) {
    const total = parent.usage;
    if (!total) continue;
    total.input_tokens += usage.input_tokens ?? 0;
    total.output_tokens += usage.output_tokens ?? 0;
    total.total_tokens += usage.total_tokens ?? 0;
    if (usage.cached_tokens) total.cached_tokens = (total.cached_tokens ?? 0) + usage.cached_tokens;
    if (usage.cost !== undefined) total.cost = (total.cost ?? 0) + usage.cost;
  }
}

/** The nearest ask above this one whose cost limit has been reached, if any. */
export function parentOverLimit(frame: AskFrame | undefined): AskFrame | undefined {
  for (let parent = frame?.parent; parent; parent = parent.parent) {
    if (parent.maxCost !== undefined && (parent.usage?.cost ?? 0) >= parent.maxCost) return parent;
  }
  return undefined;
}
