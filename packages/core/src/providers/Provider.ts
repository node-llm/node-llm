import { Message } from "../chat/Message.js";

export interface ChatRequest {
  model: string;
  messages: Message[];
}

export interface ChatChunk {
  content: string;
  done?: boolean;
}

export interface ChatResponse {
  content: string;
}

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream?(request: ChatRequest): AsyncIterable<ChatChunk>;
}
