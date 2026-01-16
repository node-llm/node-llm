import { Provider } from "../src/providers/Provider.js";
import { Message } from "../src/chat/Message.js";

export class FakeStreamingProvider implements Provider {
  id = "fake-streaming";

  async chat() {
    return { content: "not used" };
  }

  async *stream() {
    yield { content: "Hello " };
    yield { content: "world" };
  }

  defaultModel() {
    return "fake-model";
  }

  formatToolResultMessage(toolCallId: string, content: string, options?: { isError?: boolean }): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content,
      isError: options?.isError
    };
  }
}
