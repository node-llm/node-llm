import { Message } from "./Message.js";
import { ToolDefinition } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { ChatResponseString } from "./ChatResponse.js";
import { ToolExecutionMode } from "../constants.js";

export interface ChatOptions {
  systemPrompt?: string;
  messages?: Message[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  onNewMessage?: () => void;
  onEndMessage?: (message: any) => void;
  onToolCallStart?: (toolCall: any) => void;
  onToolCallEnd?: (toolCall: any, result: any) => void;
  onToolCallError?: (toolCall: any, error: Error) => void;
  headers?: Record<string, string>;
  schema?: Schema;
  responseFormat?: { type: "json_object" | "text" };
  params?: Record<string, any>;
  assumeModelExists?: boolean;
  provider?: string;
  maxToolCalls?: number;
  toolExecution?: ToolExecutionMode;
  onConfirmToolCall?: (toolCall: any) => Promise<boolean> | boolean;
  onBeforeRequest?: (messages: Message[]) => Promise<Message[] | void>;
  onAfterResponse?: (response: ChatResponseString) => Promise<ChatResponseString | void>;
}
