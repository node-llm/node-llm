import { Middleware } from "../types/Middleware.js";
import { Message } from "./Message.js";
import { ToolResolvable } from "./Tool.js";
import { ContentPart } from "./Content.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionMode } from "../constants.js";
import { ResponseFormat, ThinkingConfig, ToolChoice } from "../providers/Provider.js";

export interface ChatOptions {
  systemPrompt?: string;
  middlewares?: Middleware[];
  messages?: Message[];
  tools?: ToolResolvable[];
  temperature?: number;
  maxTokens?: number;
  onNewMessage?: () => void;
  onEndMessage?: (message: ChatResponseString) => void;
  onToolCallStart?: (toolCall: unknown) => void;
  onToolCallEnd?: (toolCall: unknown, result: unknown) => void;
  onToolCallError?: (
    toolCall: unknown,
    error: Error
  ) => "STOP" | "CONTINUE" | "RETRY" | void | Promise<"STOP" | "CONTINUE" | "RETRY" | void>;
  /**
   * Additional handlers registered via the fluent on*() methods. Each on*()
   * call appends here instead of overwriting the single onX field above, so
   * e.g. calling chat.onToolCallStart() twice runs both handlers instead of
   * silently dropping the first.
   */
  onNewMessageHandlers?: Array<() => void>;
  onEndMessageHandlers?: Array<(message: ChatResponseString) => void>;
  onToolCallStartHandlers?: Array<(toolCall: unknown) => void>;
  onToolCallEndHandlers?: Array<(toolCall: unknown, result: unknown) => void>;
  onToolCallErrorHandlers?: Array<
    (
      toolCall: unknown,
      error: Error
    ) => "STOP" | "CONTINUE" | "RETRY" | void | Promise<"STOP" | "CONTINUE" | "RETRY" | void>
  >;
  headers?: Record<string, string>;
  responseFormat?: ResponseFormat;
  thinking?: ThinkingConfig;
  prediction?: string | ContentPart[];
  schema?: Schema;
  params?: Record<string, unknown>;
  assumeModelExists?: boolean;
  provider?: string;
  maxToolCalls?: number;
  requestTimeout?: number;
  toolExecution?: ToolExecutionMode;
  /**
   * When true, independent tool calls returned in the same turn are executed
   * concurrently instead of one at a time. Defaults to `config.toolConcurrency`.
   */
  toolConcurrency?: boolean;
  toolChoice?: ToolChoice;
  toolCalls?: "one" | "many" | number;
  onConfirmToolCall?: (toolCall: unknown) => Promise<boolean> | boolean;
  onBeforeRequest?: (messages: Message[]) => Promise<Message[] | void>;
  onAfterResponse?: (response: ChatResponseString) => Promise<ChatResponseString | void>;
  onConfirmToolCallHandlers?: Array<(toolCall: unknown) => Promise<boolean> | boolean>;
  onBeforeRequestHandlers?: Array<(messages: Message[]) => Promise<Message[] | void>>;
  onAfterResponseHandlers?: Array<
    (response: ChatResponseString) => Promise<ChatResponseString | void>
  >;
}
