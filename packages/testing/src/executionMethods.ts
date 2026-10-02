/**
 * Single source of truth for the provider methods the testing harness
 * intercepts.
 *
 * Both the VCR recorder and the Mocker proxy provider instances and act only on
 * methods named here. A method missing from this registry is neither recorded
 * nor mockable: the call falls through to the real provider and reaches the
 * network during tests, silently and without failing. Every new provider
 * operation must be registered, so the list lives in one place instead of
 * beside each interceptor.
 */

const DEFAULT_EXECUTION_METHODS = [
  "chat",
  "stream",
  "paint",
  "transcribe",
  "moderate",
  "embed",
  "judge",
  "listModels"
] as const;

/** Methods returning an async iterable rather than a promise. */
const DEFAULT_STREAMING_METHODS = ["stream"] as const;

const executionMethods = new Set<string>(DEFAULT_EXECUTION_METHODS);
const streamingMethods = new Set<string>(DEFAULT_STREAMING_METHODS);

/** True when the named provider method should be intercepted. */
export function isExecutionMethod(name: string): boolean {
  return executionMethods.has(name);
}

/**
 * True when the named provider method yields an async iterable, so the
 * interceptors wrap it as a generator instead of a promise.
 */
export function isStreamingExecutionMethod(name: string): boolean {
  return streamingMethods.has(name);
}

/**
 * Registers additional provider methods for interception. Custom providers that
 * add operations of their own need this, otherwise those calls escape both the
 * recorder and the mocker.
 *
 * @example
 * registerExecutionMethod("speak");
 * registerExecutionMethod("streamSpeech", { streaming: true });
 */
export function registerExecutionMethod(
  name: string | string[],
  options: { streaming?: boolean } = {}
): void {
  for (const method of Array.isArray(name) ? name : [name]) {
    executionMethods.add(method);
    if (options.streaming) streamingMethods.add(method);
  }
}

/** The registered method names, for diagnostics and tests. */
export function getExecutionMethods(): string[] {
  return [...executionMethods];
}

/** Restores the built-in registry, discarding anything registered since. */
export function resetExecutionMethods(): void {
  executionMethods.clear();
  streamingMethods.clear();
  for (const method of DEFAULT_EXECUTION_METHODS) executionMethods.add(method);
  for (const method of DEFAULT_STREAMING_METHODS) streamingMethods.add(method);
}
