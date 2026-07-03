import { ToolCall, ToolDefinition } from "./Tool.js";
import { ToolExecutionMode } from "../constants.js";
import { ToolHandler, ToolExecutionResult } from "./ToolHandler.js";
import { Middleware, MiddlewareContext } from "../types/Middleware.js";
import { runMiddleware } from "../utils/middleware-runner.js";

export type ToolCallOutcome =
  | { kind: "cancelled"; toolCall: ToolCall }
  | { kind: "success"; toolCall: ToolCall; toolResult: ToolExecutionResult }
  | { kind: "error"; toolCall: ToolCall; error: unknown };

export interface ToolCallExecutionOptions {
  tools?: ToolDefinition[];
  toolExecution?: ToolExecutionMode;
  onConfirmToolCall?: (toolCall: unknown) => Promise<boolean> | boolean;
  onToolCallStart?: (toolCall: unknown) => void;
  onToolCallEnd?: (toolCall: unknown, result: unknown) => void;
}

/**
 * Runs a single tool call through confirmation + middleware + execution,
 * returning its outcome instead of mutating shared state or throwing.
 * Lets callers run several of these concurrently via Promise.all while still
 * applying halt/error/retry handling afterward in the original call order.
 */
async function executeToolCallOutcome(
  toolCall: ToolCall,
  options: ToolCallExecutionOptions,
  middlewares: Middleware[],
  context: MiddlewareContext
): Promise<ToolCallOutcome> {
  if (options.toolExecution === ToolExecutionMode.CONFIRM) {
    const approved = await ToolHandler.requestToolConfirmation(toolCall, options.onConfirmToolCall);
    if (!approved) {
      return { kind: "cancelled", toolCall };
    }
  }

  await runMiddleware(middlewares, "onToolCallStart", context, toolCall);

  try {
    const toolResult = await ToolHandler.execute(
      toolCall,
      options.tools,
      options.onToolCallStart,
      options.onToolCallEnd
    );

    await runMiddleware(middlewares, "onToolCallEnd", context, toolCall, toolResult.content);

    return { kind: "success", toolCall, toolResult };
  } catch (error: unknown) {
    return { kind: "error", toolCall, error };
  }
}

/**
 * Confirm mode stays sequential since approval is interactive; concurrency
 * only kicks in for AUTO/DRY_RUN turns with more than one independent call.
 */
export function shouldRunToolCallsConcurrently(
  toolConcurrency: boolean | undefined,
  toolExecution: ToolExecutionMode | undefined,
  callCount: number
): boolean {
  return Boolean(toolConcurrency) && toolExecution !== ToolExecutionMode.CONFIRM && callCount > 1;
}

export async function executeToolCallOutcomes(
  toolCalls: ToolCall[],
  options: ToolCallExecutionOptions,
  middlewares: Middleware[],
  context: MiddlewareContext,
  concurrent: boolean
): Promise<ToolCallOutcome[]> {
  if (concurrent) {
    return Promise.all(
      toolCalls.map((toolCall) => executeToolCallOutcome(toolCall, options, middlewares, context))
    );
  }

  const outcomes: ToolCallOutcome[] = [];
  for (const toolCall of toolCalls) {
    outcomes.push(await executeToolCallOutcome(toolCall, options, middlewares, context));
  }
  return outcomes;
}
