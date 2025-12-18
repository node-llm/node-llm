import { Message } from "../chat/Message.js";

export interface ChatRequest {
  model: string;
  messages: Message[];
}

export interface ChatResponse {
  content: string;
}

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}
