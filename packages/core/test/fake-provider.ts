import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";

export class FakeProvider implements Provider {
  private replies: (string | ChatResponse)[];

  constructor(replies: (string | ChatResponse)[] = []) {
    this.replies = replies;
  }

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    const reply = this.replies.shift() ?? "default reply";
    if (typeof reply === "string") {
      return { content: reply };
    }
    return reply;
  }
}
