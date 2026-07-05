import { Provider, ChatRequest, ChatResponse } from "../providers/Provider.js";
import { RateLimitError, ServerError } from "../errors/index.js";

export class Executor {
  constructor(
    private readonly provider: Provider,
    private readonly retry: { attempts: number; delayMs: number }
  ) {}

  async executeChat(request: ChatRequest): Promise<ChatResponse> {
    let lastError: unknown;

    if (request.prediction && !this.provider.capabilities?.supportsPrediction?.(request.model)) {
      delete request.prediction;
    }

    for (let attempt = 1; attempt <= this.retry.attempts; attempt++) {
      try {
        return await this.provider.chat(request);
      } catch (error) {
        lastError = error;

        // If it's a fatal error (BadRequest, Authentication), don't retry
        const isRetryable = error instanceof RateLimitError || error instanceof ServerError;

        if (!isRetryable || attempt >= this.retry.attempts) {
          throw error;
        }

        const delay = this.backoffDelay(attempt, error);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Computes the wait before the next retry. Honors a server-provided
   * `Retry-After` (via RateLimitError.retryAfter) when present; otherwise uses
   * exponential backoff with full jitter to avoid synchronized retry storms.
   */
  private backoffDelay(attempt: number, error: unknown): number {
    if (error instanceof RateLimitError && typeof error.retryAfter === "number") {
      return Math.max(0, error.retryAfter * 1000);
    }

    const base = this.retry.delayMs > 0 ? this.retry.delayMs : 0;
    if (base === 0) return 0;

    // Exponential: base * 2^(attempt-1), capped at 30s, with full jitter.
    const exponential = Math.min(base * 2 ** (attempt - 1), 30_000);
    return Math.floor(Math.random() * exponential);
  }
}
