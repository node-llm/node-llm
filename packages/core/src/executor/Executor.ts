import { Provider, ChatRequest, ChatResponse } from "../providers/Provider.js";
import { InsufficientQuotaError, RateLimitError, ServerError } from "../errors/index.js";
import { FallbackEvent, ResolvedFallback, isFallbackError } from "./Fallback.js";

export interface FallbackSettings {
  /** Fallbacks in the order to try them, resolved lazily. */
  resolve: () => Array<() => ResolvedFallback>;
  onFallback?: (event: FallbackEvent) => void | Promise<void>;
}

export class Executor {
  /** The provider and model that served the last successful request. */
  public servedBy?: { provider: Provider; model: string };

  constructor(
    private readonly provider: Provider,
    private readonly retry: { attempts: number; delayMs: number },
    private readonly fallbacks?: FallbackSettings
  ) {}

  /**
   * Sends the request to the chat's model, retrying transient errors. When it
   * still fails with a rate limit, server or network error, tries each
   * fallback model in order. Throws the last error when every one fails.
   */
  async executeChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.executeOn(this.provider, request);
      this.servedBy = { provider: this.provider, model: request.model };
      return response;
    } catch (error) {
      const candidates = this.fallbacks?.resolve() ?? [];
      if (candidates.length === 0 || !isFallbackError(error)) throw error;

      let lastError: unknown = error;
      let from = { model: request.model, provider: this.provider.id };
      let attempt = 0;
      for (const candidate of candidates) {
        let target: ResolvedFallback;
        try {
          target = candidate();
        } catch {
          continue; // Skip a fallback whose provider is not configured.
        }
        attempt++;
        const to = { model: target.model, provider: target.provider.id };
        await this.fallbacks?.onFallback?.({ error: lastError, from, to, attempt });
        try {
          const response = await this.executeOn(target.provider, {
            ...request,
            model: target.model
          });
          this.servedBy = { provider: target.provider, model: target.model };
          return response;
        } catch (fallbackError) {
          lastError = fallbackError;
          if (!isFallbackError(fallbackError)) throw fallbackError;
          from = to;
        }
      }
      throw lastError;
    }
  }

  private async executeOn(provider: Provider, request: ChatRequest): Promise<ChatResponse> {
    let lastError: unknown;

    if (request.prediction && !provider.capabilities?.supportsPrediction?.(request.model)) {
      request = { ...request };
      delete request.prediction;
    }

    for (let attempt = 1; attempt <= this.retry.attempts; attempt++) {
      try {
        return await provider.chat(request);
      } catch (error) {
        lastError = error;

        // Fatal errors (bad request, authentication, an account out of credit) fail straight away:
        // trying again can't help.
        const isRetryable =
          (error instanceof RateLimitError && !(error instanceof InsufficientQuotaError)) ||
          error instanceof ServerError;

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
      return Math.min(Math.max(1000, error.retryAfter * 1000), 60_000);
    }

    const base = this.retry.delayMs > 0 ? this.retry.delayMs : 1000;
    // Exponential: base * 2^(attempt-1), capped at 30s, with full jitter.
    const exponential = Math.min(base * 2 ** (attempt - 1), 30_000);
    return Math.floor(Math.random() * exponential);
  }
}
