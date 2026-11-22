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
  /** Cancels this ask; a subagent's ask is cancelled with every ask above it. */
  signal?: AbortSignal;
  /** Run before each request of any subagent below this ask; one that throws stops it. */
  beforeSubagentRequest?: Array<() => void | Promise<void>>;
  /** Run after each response of any subagent below this ask. */
  afterSubagentResponse?: Array<(response: SubagentResponse) => void | Promise<void>>;
  /** A group of subagents (see runAgents), not an ask: it doesn't count as a level of depth. */
  group?: boolean;
}

/** One response of a subagent, as the asks above it see it. */
export interface SubagentResponse {
  usage: Usage;
  model: string;
  provider: string;
  /** Milliseconds the request took */
  latency: number;
  /** How far below the ask seeing it: 1 for its own subagent */
  depth: number;
}

/** The signal for a subagent's ask: its own, cancelled too when an ask above it is. */
export function inheritedSignal(
  own: AbortSignal | undefined,
  parent: AskFrame | undefined
): AbortSignal | undefined {
  const above = parent?.signal;
  if (!above) return own;
  if (!own || own === above) return above;
  return AbortSignal.any([own, above]);
}

/** Runs the beforeSubagentRequest hooks of every ask above this one, nearest first. */
export async function beforeSubagentRequest(frame: AskFrame | undefined): Promise<void> {
  for (let parent = frame?.parent; parent; parent = parent.parent) {
    for (const hook of parent.beforeSubagentRequest ?? []) await hook();
  }
}

/** Runs the afterSubagentResponse hooks of every ask above this one, nearest first. */
export async function afterSubagentResponse(
  frame: AskFrame | undefined,
  response: Omit<SubagentResponse, "depth">
): Promise<void> {
  let depth = 1;
  for (let parent = frame?.parent; parent; parent = parent.parent) {
    if (parent.group) continue;
    for (const hook of parent.afterSubagentResponse ?? []) await hook({ ...response, depth });
    depth++;
  }
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
