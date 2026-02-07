import { Message } from "../chat/Message.js";
import { ChatOptions } from "../chat/ChatOptions.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolCall } from "../chat/Tool.js";
import { GeneratedImage } from "../image/GeneratedImage.js";
import { Transcription } from "../transcription/Transcription.js";
import { Moderation } from "../moderation/Moderation.js";
import { Embedding } from "../embedding/Embedding.js";

/**
 * All possible response types that can be returned by NodeLLM.
 */
export type NodeLLMResponse =
  | ChatResponseString
  | GeneratedImage
  | Transcription
  | Moderation
  | Embedding;

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
  embeddingOptions?: Record<string, unknown>;

  /**
   * Options passed to the transcription request (Transcription only).
   */
  transcriptionOptions?: Record<string, unknown>;

  /**
   * Options passed to the moderation request (Moderation only).
   */
  moderationOptions?: Record<string, unknown>;

  /**
   * Options passed to the image generation request (Paint only).
   */
  imageOptions?: Record<string, unknown>;

  /**
   * Shared state storage for passing data between middleware hooks.
   * Example: Storing start time in `onRequest` and reading it in `onResponse`.
   */
  state: Record<string, unknown>;
}

/**
 * Directives for handling tool execution errors.
 */
export type ToolErrorDirective = "STOP" | "CONTINUE" | "RETRY" | void;

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
  onResponse?(ctx: MiddlewareContext, result: NodeLLMResponse): Promise<void>;

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
   * Can return a directive to tell the engine how to proceed.
   */
  onToolCallError?(
    ctx: MiddlewareContext,
    tool: ToolCall,
    error: Error
  ): Promise<ToolErrorDirective>;
}
