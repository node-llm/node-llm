import { Message } from "./Message.js";

export interface ChatOptions {
  systemPrompt?: string;
  messages?: Message[];
}
