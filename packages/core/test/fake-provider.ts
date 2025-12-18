import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";

export class FakeProvider implements Provider {
  private replies: string[];

  constructor(replies: string[] = []) {
    this.replies = replies;
  }

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    const reply = this.replies.shift() ?? "default reply";
    return { content: reply };
  }
}
