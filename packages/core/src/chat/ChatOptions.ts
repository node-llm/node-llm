import type { ContextBudget } from "./ContextBudget.js";
import type { EndWith } from "./EndWith.js";
import type { StallGuard } from "./StallGuard.js";
import type { FileSecurity } from "../utils/FileSecurity.js";
import { Middleware } from "../types/Middleware.js";
import { Message } from "./Message.js";
import { ToolResolvable, ToolCall } from "./Tool.js";
import { ContentPart } from "./Content.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionModeInput } from "../constants.js";
import { Provider, ResponseFormat, ThinkingConfig, ToolChoice } from "../providers/Provider.js";
import { FallbackEvent, FallbackTarget } from "../executor/Fallback.js";

export interface ChatOptions {
  systemPrompt?: string;
  middlewares?: Middleware[];
  messages?: Message[];
  tools?: ToolResolvable[];
  temperature?: number;
  maxTokens?: number;
  onNewMessage?: () => void;
  onEndMessage?: (message: ChatResponseString) => void;
  onToolCallStart?: (toolCall: ToolCall) => void;
  onToolCallEnd?: (toolCall: ToolCall, result: unknown) => void;
  onToolCallError?: (
    toolCall: ToolCall,
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
  onToolCallStartHandlers?: Array<(toolCall: ToolCall) => void>;
  onToolCallEndHandlers?: Array<(toolCall: ToolCall, result: unknown) => void>;
  onToolCallErrorHandlers?: Array<
    (
      toolCall: ToolCall,
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
  /**
   * Sends only the most recent N tool results in full; older ones are replaced with a short
   * placeholder in each request (the chat's history keeps them). Keeps long tool loops, such as
   * an agent reading many pages, from resending every earlier result on every request.
   */
  keepToolResults?: number;
  /**
   * The most an ask may spend, in US dollars. A tool loop that has spent this much stops before
   * its next request and throws CostLimitError. It needs the model's pricing, so it does nothing
   * for models without it.
   */
  maxCost?: number;
  /**
   * Stops a tool loop that repeats the same call with the same result, or makes a run of calls
   * with no progress, with StalledError. Off unless set.
   */
  stallGuard?: StallGuard | null;
  maxCorrections?: number;
  /**
   * A tool the model must call before its turn ends, such as one that reports a result. When the
   * model ends its turn without calling it, it is reminded once; if it still doesn't, the ask
   * throws EndToolNotCalledError.
   */
  endWith?: EndWith | null;
  requestTimeout?: number;
  /** Rules for the files and URLs this chat may load; see FileSecurity. */
  fileSecurity?: FileSecurity;
  toolExecution?: ToolExecutionModeInput;
  /**
   * When true, independent tool calls returned in the same turn are executed
   * concurrently instead of one at a time. A number caps how many run at once
   * (every call still runs, that many at a time). Defaults to
   * `config.toolConcurrency`.
   */
  toolConcurrency?: boolean | number;
  /**
   * Shares of the model's context window tool results may take. `null` turns
   * off a budget set in `config`. See `ContextBudget`.
   */
  contextBudget?: ContextBudget | null;
  /**
   * Cache the repeated start of each request (instructions, tools and earlier turns) on providers
   * that need asking to, such as Anthropic. Others cache automatically.
   */
  promptCache?: boolean;
  toolChoice?: ToolChoice;
  toolCalls?: "one" | "many" | number;
  onConfirmToolCall?: (toolCall: ToolCall) => Promise<boolean> | boolean;
  onBeforeRequest?: (messages: Message[]) => Promise<Message[] | void>;
  onAfterResponse?: (response: ChatResponseString) => Promise<ChatResponseString | void>;
  onConfirmToolCallHandlers?: Array<(toolCall: ToolCall) => Promise<boolean> | boolean>;
  onBeforeRequestHandlers?: Array<(messages: Message[]) => Promise<Message[] | void>>;
  onAfterResponseHandlers?: Array<
    (response: ChatResponseString) => Promise<ChatResponseString | void>
  >;
  /** Models to try, in order, when the chat's model fails with a rate limit, server or network error. */
  fallbacks?: FallbackTarget[];
  onFallbackHandlers?: Array<(event: FallbackEvent) => void | Promise<void>>;
  /**
   * @internal Resolves a provider by registry name for cross-provider fallbacks.
   * Set by `llm.chat()`.
   */
  resolveProvider?: (name: string) => Provider;
}
