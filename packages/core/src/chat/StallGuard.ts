import { ToolCall } from "./Tool.js";
import { StalledError, type StallReason } from "../errors/index.js";
import type { Usage } from "../providers/Provider.js";

/**
 * Stops a tool loop that is going nowhere, before its next request, with StalledError. Each limit
 * is off unless set.
 */
export interface StallGuard {
  /**
   * Stop when the model makes the same call (tool and arguments) this many times in one ask and
   * gets the same result each time.
   */
  repeats?: number;
  /** Stop after this many tool calls in a row that made no progress. */
  noProgress?: number;
  /**
   * Whether a call made progress. By default, a call made progress when it didn't fail and its
   * result differs from every earlier result of the same tool in the ask. A call failed when its
   * tool threw, including errors a `Tool` returns to the model as text.
   */
  progress?: (call: ToolCall, result: string, failed: boolean) => boolean;
}

// What Tool.handler returns to the model when a tool throws or gets arguments it rejects.
const TOOL_ERROR = /^(Error executing tool '|Invalid tool arguments: )/;

/** Watches one ask's tool calls for a StallGuard. */
export class StallWatch {
  private readonly repeats = new Map<string, { result: string; count: number }>();
  private readonly results = new Map<string, Set<string>>();
  private stuck: ToolCall[] = [];
  private stalled?: { reason: StallReason; calls: ToolCall[]; count: number };

  constructor(private readonly guard: StallGuard) {}

  /** Records a call that was run and the result the model was sent. */
  record(call: ToolCall, result: string, threw: boolean): void {
    if (this.stalled) return;
    const failed = threw || TOOL_ERROR.test(result);
    const { repeats, noProgress } = this.guard;

    const key = `${call.function.name}\u0000${call.function.arguments}`;
    const seen = this.repeats.get(key);
    const count = seen && seen.result === result ? seen.count + 1 : 1;
    this.repeats.set(key, { result, count });
    if (repeats && count >= repeats) {
      this.stalled = { reason: "repeated", calls: [call], count };
      return;
    }

    const earlier = this.results.get(call.function.name) ?? new Set<string>();
    const progressed = this.guard.progress
      ? this.guard.progress(call, result, failed)
      : !failed && !earlier.has(result);
    earlier.add(result);
    this.results.set(call.function.name, earlier);

    this.stuck = progressed ? [] : [...this.stuck, call];
    if (noProgress && this.stuck.length >= noProgress) {
      this.stalled = { reason: "no_progress", calls: this.stuck, count: this.stuck.length };
    }
  }

  /** The error to throw when the loop has stalled. */
  error(usage: Usage): StalledError | undefined {
    if (!this.stalled) return undefined;
    const { reason, calls, count } = this.stalled;
    return new StalledError(reason, calls, count, usage);
  }
}

export function stallWatch(guard: StallGuard | null | undefined): StallWatch | undefined {
  return guard && (guard.repeats || guard.noProgress) ? new StallWatch(guard) : undefined;
}
