import { Middleware, MiddlewareContext } from "../types/Middleware.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { logger } from "../utils/logger.js";

export interface UsageLoggerOptions {
  /**
   * Optional custom logger function. Defaults to internal NodeLLM logger.
   */
  logger?: (message: string, data: any) => void;
  /**
   * Prefix for the log message.
   */
  prefix?: string;
}

/**
 * Middleware that logs token usage and costs for every successful request.
 */
export class UsageLoggerMiddleware implements Middleware {
  public readonly name = "UsageLogger";

  constructor(private options: UsageLoggerOptions = {}) {}

  async onResponse(ctx: MiddlewareContext, result: ChatResponseString): Promise<void> {
    const usage = result.usage;
    if (!usage) return;

    const logFn =
      this.options.logger || ((msg, data) => logger.info(`${msg} ${JSON.stringify(data)}`));
    const prefix = this.options.prefix ? `[${this.options.prefix}] ` : "";

    const message = `${prefix}LLM Usage: ${ctx.provider}/${ctx.model}`;
    const data = {
      requestId: ctx.requestId,
      tokens: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        total: usage.total_tokens,
        cached: usage.cached_tokens
      },
      cost: usage.cost ? usage.cost.toFixed(6) : undefined
    };

    logFn(message, data);
  }
}
