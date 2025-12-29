import { Message } from "../chat/Message.js";
import { Tool, ToolCall } from "../chat/Tool.js";

export interface ChatRequest {
  model: string;
  messages: Message[];
  tools?: Tool[];
}

export interface ChatChunk {
  content: string;
  done?: boolean;
}

export interface ChatResponse {
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream?(request: ChatRequest): AsyncIterable<ChatChunk>;
}
