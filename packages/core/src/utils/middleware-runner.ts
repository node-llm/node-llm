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

  let finalResult: T | undefined;

  for (const middleware of middlewares) {
    if (typeof middleware[hookName] === "function") {
      // @ts-ignore
      const result = await middleware[hookName](context, ...args);
      // Capture the first non-void result (for directives)
      if (result !== undefined && finalResult === undefined) {
        finalResult = result as T;
      }
    }
  }

  return finalResult;
}
