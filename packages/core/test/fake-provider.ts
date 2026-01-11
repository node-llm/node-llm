import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";

export class FakeProvider implements Provider {
  id = "fake";
  private replies: (string | ChatResponse)[];

  constructor(replies: (string | ChatResponse)[] = []) {
    this.replies = replies;
  }

  public lastRequest?: ChatRequest;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.lastRequest = request;
    const reply = this.replies.shift() ?? "default reply";
    if (typeof reply === "string") {
      return { content: reply };
    }
    return reply;
  }

  defaultModel(_feature?: string): string {
    return "fake-default-model";
  }
}
