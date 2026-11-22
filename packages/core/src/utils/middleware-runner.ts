import { Middleware, MiddlewareContext } from "../types/Middleware.js";

/**
 * Helper to execute middleware chains in order.
 * @internal
 */
export async function runMiddleware<T = void>(
  middlewares: Middleware[],
  hookName: keyof Middleware,
  context: MiddlewareContext,
  ...args: any[]
): Promise<T | undefined> {
  if (!middlewares || middlewares.length === 0) return undefined;

  // Response and error hooks run in reverse order (stack model)
  const isReverse = ["onResponse", "onError", "onToolCallEnd", "onToolCallError"].includes(
    hookName
  );
  const chain = isReverse ? [...middlewares].reverse() : middlewares;

  let finalResult: T | undefined;

  for (const middleware of chain) {
    if (typeof middleware[hookName] === "function") {
      // @ts-ignore
      const result = await middleware[hookName](context, ...args);
      // Capture the first non-void result (for directives). From onResponse, "CONTINUE" asks for
      // nothing, so it doesn't hide another middleware's RETRY or REPLACE.
      const asksNothing = hookName === "onResponse" && result === "CONTINUE";
      if (result !== undefined && !asksNothing && finalResult === undefined) {
        finalResult = result as T;
      }
    }
  }

  return finalResult;
}
