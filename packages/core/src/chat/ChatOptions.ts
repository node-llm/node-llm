import { Message } from "./Message.js";
import { ToolDefinition, ToolResolvable } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionMode } from "../constants.js";

export interface ChatOptions {
  systemPrompt?: string;
  messages?: Message[];
  tools?: ToolResolvable[];
  temperature?: number;
  maxTokens?: number;
  onNewMessage?: () => void;
  onEndMessage?: (message: any) => void;
  onToolCallStart?: (toolCall: any) => void;
  onToolCallEnd?: (toolCall: any, result: any) => void;
  onToolCallError?: (toolCall: any, error: Error) => 'STOP' | 'CONTINUE' | void | Promise<'STOP' | 'CONTINUE' | void>;
  headers?: Record<string, string>;
  schema?: Schema;
  responseFormat?: { type: "json_object" | "text" };
  params?: Record<string, any>;
  assumeModelExists?: boolean;
  provider?: string;
  maxToolCalls?: number;
  requestTimeout?: number;
  toolExecution?: ToolExecutionMode;
  onConfirmToolCall?: (toolCall: any) => Promise<boolean> | boolean;
  onBeforeRequest?: (messages: Message[]) => Promise<Message[] | void>;
  onAfterResponse?: (response: ChatResponseString) => Promise<ChatResponseString | void>;
}
