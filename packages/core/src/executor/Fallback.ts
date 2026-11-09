import { ChatChunk, ChatRequest, Provider } from "../providers/Provider.js";
import { ConfigurationError } from "../errors/index.js";
import { resolveModelAlias } from "../model_aliases.js";
import { LLMError, RateLimitError, ServerError } from "../errors/index.js";

/** A model to try when the chat's model fails. A string is a model id on the same provider. */
export type FallbackTarget = string | { model: string; provider?: string };

/** Details of one fallback attempt, passed to `chat.onFallback` handlers. */
export interface FallbackEvent {
  /** The error that triggered this attempt. */
  error: unknown;
  from: { model: string; provider: string };
  to: { model: string; provider: string };
  /** Attempt number, starting at 1. */
  attempt: number;
}

/**
 * Whether an error may move on to a fallback: rate limits (including an
 * exhausted quota, which another provider may not share), server errors and
 * network failures. Bad requests, auth errors and cancellations never do.
 */
export function isFallbackError(error: unknown): boolean {
  if (error instanceof RateLimitError || error instanceof ServerError) return true;
  if (error instanceof LLMError) return false;
  if (error instanceof Error && error.name === "AbortError") return false;
  // fetch() rejects with a TypeError when the connection fails.
  return (
    error instanceof TypeError &&
    /fetch failed|network|ECONN|ETIMEDOUT/i.test(
      `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
    )
  );
}

export interface ResolvedFallback {
  provider: Provider;
  model: string;
}

/** Resolves a fallback target to a provider instance and model id. */
export type FallbackResolver = (target: FallbackTarget, current: Provider) => ResolvedFallback;

/** Resolves a fallback target against the chat's current provider. */
export function resolveFallbackTarget(
  target: FallbackTarget,
  current: Provider,
  resolveProvider?: (name: string) => Provider
): ResolvedFallback {
  const { model, provider: name } = typeof target === "string" ? { model: target } : target;
  const sameProvider = !name || name.toLowerCase() === current.id.toLowerCase();
  if (!sameProvider && !resolveProvider) {
    throw new ConfigurationError(`Cannot resolve fallback provider '${name}'`);
  }
  const provider = sameProvider ? current : resolveProvider!(name!);
  return { provider, model: resolveModelAlias(model, provider.id) };
}

/**
 * Streams from the chat's provider, moving on to each fallback when a stream
 * fails with a fallback error before it yields anything. Once a chunk has been
 * yielded, an error is thrown as is: the caller has already seen part of an answer.
 */
export async function* streamWithFallbacks(
  provider: Provider,
  request: ChatRequest,
  fallbacks: FallbackTarget[] | undefined,
  resolveProvider: ((name: string) => Provider) | undefined,
  onFallback?: (event: FallbackEvent) => void | Promise<void>
): AsyncGenerator<ChatChunk> {
  const attempts: Array<() => ResolvedFallback> = [
    () => ({ provider, model: request.model }),
    ...(fallbacks ?? []).map((t) => () => resolveFallbackTarget(t, provider, resolveProvider))
  ];
  let lastError: unknown;
  let from = { model: request.model, provider: provider.id };
  let attempt = 0;

  for (const [index, candidate] of attempts.entries()) {
    let target: ResolvedFallback;
    try {
      target = candidate();
    } catch {
      continue;
    }
    if (!target.provider.stream) continue;
    if (index > 0) {
      attempt++;
      const to = { model: target.model, provider: target.provider.id };
      await onFallback?.({ error: lastError, from, to, attempt });
      from = to;
    }

    let yielded = false;
    try {
      for await (const chunk of target.provider.stream({ ...request, model: target.model })) {
        yielded = true;
        yield chunk;
      }
      return;
    } catch (error) {
      if (yielded || !isFallbackError(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
