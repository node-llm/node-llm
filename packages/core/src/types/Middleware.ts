import { FallbackEvent } from "../executor/Fallback.js";
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
   * Options for the judgment request (Judgment only).
   */
  judgmentOptions?: Record<string, unknown>;

  /**
   * The input a judgment is asked about (Judgment only). Text or JSON-compatible
   * structured data. Mutating it in `onRequest` affects the actual call.
   */
  judgmentInput?: unknown;

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
 * Directives for handling LLM responses or errors.
 * Useful for automated retries (e.g., self-correction).
 */
export type RequestDirective =
  | {
      action: "RETRY";
      /** Feedback message to append to history for the model to see in the next turn */
      message: string;
    }
  | {
      action: "REPLACE";
      /** Replace the original response with this one */
      response: NodeLLMResponse;
    }
  | "CONTINUE"
  | "STOP"
  | void;

/** What `onToolCallEnd` may return: the result to send the model in place of the tool's own. */
export interface ToolResultChange {
  content: string;
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
   * Can return a directive to tell the engine to retry or stop.
   */
  onResponse?(ctx: MiddlewareContext, result: NodeLLMResponse): Promise<RequestDirective>;

  /**
   * Called if an error occurs during execution.
   */
  onError?(ctx: MiddlewareContext, error: Error): Promise<RequestDirective>;

  /**
   * Called before a tool is executed.
   * Throwing here will prevent the tool from running.
   */
  onToolCallStart?(ctx: MiddlewareContext, tool: ToolCall): Promise<void>;

  /**
   * Called after a tool completes successfully. Return `{ content }` to change the result the
   * model is sent, such as to mask personal data in it.
   */
  onToolCallEnd?(
    ctx: MiddlewareContext,
    tool: ToolCall,
    result: unknown
  ): Promise<void | ToolResultChange>;

  /**
   * Called with every tool result the model is about to be sent, a tool's error included. Return
   * `{ content }` to change it, such as to mask personal data. Runs after onToolCallEnd.
   */
  onToolResult?(
    ctx: MiddlewareContext,
    tool: ToolCall,
    content: string,
    info: { isError: boolean }
  ): Promise<void | ToolResultChange>;

  /**
   * Called if a tool execution fails.
   * Can return a directive to tell the engine how to proceed.
   */
  onToolCallError?(
    ctx: MiddlewareContext,
    tool: ToolCall,
    error: Error
  ): Promise<ToolErrorDirective>;

  /**
   * Called when a chat request failed and is about to be sent to a fallback
   * model (see `chat.withFallbacks`). The response that follows reports the
   * model and provider that answered.
   */
  onFallback?(ctx: MiddlewareContext, event: FallbackEvent): Promise<void>;
}
