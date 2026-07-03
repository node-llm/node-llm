/**
 * Combines a single "constructor-provided" handler with a list of handlers
 * appended later (e.g. via fluent on*() calls), preserving registration order.
 */
export function collectHandlers<T>(single: T | undefined, list: T[] | undefined): T[] {
  const handlers: T[] = [];
  if (single) handlers.push(single);
  if (list) handlers.push(...list);
  return handlers;
}

/**
 * Runs every handler with the given args, awaiting each in order. Use for
 * pure observers (onNewMessage, onEndMessage, onToolCallStart, onToolCallEnd)
 * where every registered handler should fire and none of them return a value.
 */
export async function runAllHandlers<Args extends unknown[]>(
  handlers: Array<(...args: Args) => unknown>,
  ...args: Args
): Promise<void> {
  for (const handler of handlers) {
    await handler(...args);
  }
}

/**
 * Runs every handler in order and returns the first defined (non-void)
 * result, but still calls the remaining handlers so every one of them gets a
 * chance to observe/react (mirrors the middleware-runner directive pattern).
 * Use for onToolCallError, where the first STOP/RETRY/CONTINUE wins.
 */
export async function runDirectiveHandlers<Args extends unknown[], R>(
  handlers: Array<(...args: Args) => R | void | Promise<R | void>>,
  ...args: Args
): Promise<R | undefined> {
  let result: R | undefined;
  for (const handler of handlers) {
    const value = await handler(...args);
    if (value !== undefined && result === undefined) {
      result = value;
    }
  }
  return result;
}

/**
 * Runs every handler in order, AND-ing boolean results together. Used for
 * onConfirmToolCall: every registered handler must approve for the call to
 * proceed. Short-circuits once a handler declines.
 */
export async function runConfirmHandlers<Args extends unknown[]>(
  handlers: Array<(...args: Args) => Promise<boolean> | boolean>,
  ...args: Args
): Promise<boolean> {
  for (const handler of handlers) {
    const approved = await handler(...args);
    if (approved === false) return false;
  }
  return true;
}

/**
 * Runs every handler in order, feeding each handler's (possibly transformed)
 * output into the next as its input. Used for onBeforeRequest/onAfterResponse,
 * where each handler may rewrite the value for downstream handlers.
 */
export async function runChainHandlers<T>(
  handlers: Array<(value: T) => Promise<T | void> | T | void>,
  initial: T
): Promise<T> {
  let value = initial;
  for (const handler of handlers) {
    const result = await handler(value);
    if (result !== undefined) {
      value = result;
    }
  }
  return value;
}
