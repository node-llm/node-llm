import { Middleware, MiddlewareContext } from "../types/Middleware.js";
import { ChatResponseString } from "../chat/ChatResponse.js";

export interface CostGuardOptions {
  /**
   * Maximum allowed cost (in USD) for a single request sequence.
   */
  maxCost: number;
  /**
   * Callback when the limit is exceeded.
   */
  onLimitExceeded?: (ctx: MiddlewareContext, currentCost: number) => void;
}

/**
 * Middleware that monitors accumulated cost during a session (especially multi-turn tool calls)
 * and throws an error if a defined limit is exceeded.
 */
export class CostGuardMiddleware implements Middleware {
  public readonly name = "CostGuard";
  private accumulatedCost: number = 0;

  constructor(private options: CostGuardOptions) {
    if (options.maxCost <= 0) {
      throw new Error("CostGuard maxCost must be greater than 0");
    }
  }

  async onResponse(ctx: MiddlewareContext, result: ChatResponseString): Promise<void> {
    const cost = result.usage?.cost || 0;
    this.accumulatedCost += cost;

    if (this.accumulatedCost > this.options.maxCost) {
      this.options.onLimitExceeded?.(ctx, this.accumulatedCost);
      throw new Error(
        `[CostGuard] Budget exceeded. Accumulated cost $${this.accumulatedCost.toFixed(6)} exceeds limit $${this.options.maxCost.toFixed(6)}`
      );
    }
  }
}
