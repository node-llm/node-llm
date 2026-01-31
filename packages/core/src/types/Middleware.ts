import { Message } from "../chat/Message.js";
import { ChatOptions } from "../chat/ChatOptions.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolCall } from "../chat/Tool.js";

/**
 * Context passed to all middleware hooks.
 * This object is shared across the lifecycle of a single request.
 */
export interface MiddlewareContext {
  /**
   * Unique ID for tracing the request across the system.
   */
  requestId: string;

  /**
   * The provider being used (e.g., "openai", "anthropic").
   */
  provider: string;

  /**
   * The model identifier being used.
   */
  model: string;

  /**
   * The messages sent to the model (Chat only).
   * Mutating this array in `onRequest` affects the actual call.
   */
  messages?: Message[];

  /**
   * Configuration options for the chat request (Chat only).
   * Mutating this object in `onRequest` affects the actual call.
   */
  options?: ChatOptions;

  /**
   * Input text(s) for embeddings (Embedding only).
   */
  input?: string | string[];

  /**
   * Options passed to the embedding request (Embedding only).
   */
  embeddingOptions?: Record<string, any>;

  /**
   * Shared state storage for passing data between middleware hooks.
   * Example: Storing start time in `onRequest` and reading it in `onResponse`.
   */
  state: Record<string, unknown>;
}

/**
 * Middleware interface for hooking into the LLM execution lifecycle.
 */
export interface Middleware {
  /**
   * Name of the middleware (useful for debugging).
   */
  name: string;

  /**
   * Called before the request is sent to the provider.
   * Can allow modifying messages or options.
   */
  onRequest?(ctx: MiddlewareContext): Promise<void>;

  /**
   * Called after a successful response from the provider.
   */
  onResponse?(ctx: MiddlewareContext, result: ChatResponseString): Promise<void>;

  /**
   * Called if an error occurs during execution.
   */
  onError?(ctx: MiddlewareContext, error: Error): Promise<void>;

  /**
   * Called before a tool is executed.
   * Throwing here will prevent the tool from running.
   */
  onToolCallStart?(ctx: MiddlewareContext, tool: ToolCall): Promise<void>;

  /**
   * Called after a tool completes successfully.
   */
  onToolCallEnd?(ctx: MiddlewareContext, tool: ToolCall, result: unknown): Promise<void>;

  /**
   * Called if a tool execution fails.
   */
  onToolCallError?(ctx: MiddlewareContext, tool: ToolCall, error: Error): Promise<void>;
}
