import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";
import { Message } from "../src/chat/Message.js";

export class FakeProvider implements Provider {
  id = "fake";
  private replies: (string | ChatResponse | Error)[];

  constructor(replies: (string | ChatResponse | Error)[] = []) {
    this.replies = replies;
  }

  public lastRequest?: ChatRequest;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.lastRequest = request;
    const reply = this.replies.shift() ?? "default reply";

    if (reply instanceof Error) {
      throw reply;
    }

    if (typeof reply === "string") {
      return { content: reply };
    }
    return reply;
  }

  async *stream(request: ChatRequest) {
    this.lastRequest = request;
    const reply = this.replies.shift() ?? "default reply";

    if (reply instanceof Error) {
      throw reply;
    }

    if (typeof reply === "string") {
      const words = reply.split(" ");
      for (const word of words) {
        yield { content: word + (word === words[words.length - 1] ? "" : " ") };
      }
    } else {
      if (reply.content) {
        const words = reply.content.split(" ");
        for (const word of words) {
          yield { content: word + (word === words[words.length - 1] ? "" : " ") };
        }
      }

      // Yield thinking, reasoning and tool_calls in the last chunk
      yield {
        content: "",
        reasoning: reply.reasoning || undefined,
        thinking: reply.thinking,
        tool_calls: reply.tool_calls
      };
    }
  }

  defaultModel(_feature?: string): string {
    return "fake-default-model";
  }

  formatToolResultMessage(toolCallId: string, content: string): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content
    };
  }
}
