import { Message } from "../../chat/Message.js";

export interface OpenAIChatRequest {
  model: string;
  messages: Message[];
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
}
