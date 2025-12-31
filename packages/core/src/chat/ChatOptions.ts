import { Message } from "./Message.js";
import { Tool } from "./Tool.js";

export interface ChatOptions {
  systemPrompt?: string;
  messages?: Message[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  onNewMessage?: () => void;
  onEndMessage?: (message: any) => void;
  onToolCall?: (toolCall: any) => void;
  onToolResult?: (result: any) => void;
  headers?: Record<string, string>;
}
