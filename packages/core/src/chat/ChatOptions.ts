import { Message } from "./Message.js";
import { ToolResolvable } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionMode } from "../constants.js";
import { ResponseFormat } from "../providers/Provider.js";

export interface ChatOptions {
  systemPrompt?: string;
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
  schema?: Schema;
  responseFormat?: ResponseFormat;
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
