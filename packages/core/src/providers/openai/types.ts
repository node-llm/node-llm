import { Message } from "../../chat/Message.js";

export interface OpenAIChatRequest {
  model: string;
  messages: Message[];
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}
