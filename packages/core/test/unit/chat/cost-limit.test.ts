import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { CostLimitError } from "../../../src/errors/index.js";
import { ChatRequest, ChatResponse, Provider } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";

// Always asks for another page, and charges 50 cents a request.
class ExpensiveProvider implements Provider {
  id = "expensive";
  requests = 0;

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    this.requests += 1;
    return {
      content: null,
      usage: { input_tokens: 1000, output_tokens: 10, total_tokens: 1010, cost: 0.5 },
      tool_calls: [
        {
          id: `call_${this.requests}`,
          type: "function",
          function: { name: "read_page", arguments: "{}" }
        }
      ]
    };
  }

  defaultModel() {
    return "test-model";
  }

  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const readPage = {
  type: "function" as const,
  function: { name: "read_page", description: "Read a page", parameters: { type: "object" } },
  handler: async () => "A page"
};

describe("maxCost", () => {
  it("stops a tool loop once it has spent the limit, leaving a history that can be asked again", async () => {
    const provider = new ExpensiveProvider();
    const chat = new Chat(provider, "test-model", { maxCost: 0.6 });

    const asking = chat.withTool(readPage).ask("Read every page");

    await expect(asking).rejects.toThrow(CostLimitError);
    const error = await asking.catch((caught: CostLimitError) => caught);
    expect(error.limit).toBe(0.6);
    expect(error.usage.cost).toBe(1);
    expect(provider.requests).toBe(2);
    expect(chat.history.at(-1)).toMatchObject({
      role: "tool",
      content: "Not run: the cost limit ($0.6) was reached."
    });
  });
});
