import { Middleware } from "../types/Middleware.js";
import { Message } from "./Message.js";
import { ToolResolvable } from "./Tool.js";
import { ContentPart } from "./Content.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionMode } from "../constants.js";
import { ResponseFormat, ThinkingConfig } from "../providers/Provider.js";

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
  onConfirmToolCall?: (toolCall: unknown) => Promise<boolean> | boolean;
  onBeforeRequest?: (messages: Message[]) => Promise<Message[] | void>;
  onAfterResponse?: (response: ChatResponseString) => Promise<ChatResponseString | void>;
}
