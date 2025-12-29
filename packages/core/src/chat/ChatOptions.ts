import { Message } from "./Message.js";
import { Tool } from "./Tool.js";

export interface ChatOptions {
  systemPrompt?: string;
  messages?: Message[];
  tools?: Tool[];
}
