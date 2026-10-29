import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Agent } from "../../../src/agent/Agent.js";
import { windowToolResults, OMITTED_TOOL_RESULT } from "../../../src/chat/ToolResultWindow.js";
import { ChatRequest, ChatResponse, Provider } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";

// Answers with a tool call for each page in turn, then a final reply, keeping every request.
class PageReadingProvider implements Provider {
  id = "pages";
  requests: ChatRequest[] = [];
  private turn = 0;

  constructor(private readonly pages: number) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({ ...request, messages: [...request.messages] });
    this.turn += 1;
    if (this.turn > this.pages) return { content: "Read every page." };
    return {
      content: null,
      tool_calls: [
        {
          id: `call_${this.turn}`,
          type: "function",
          function: { name: "read_page", arguments: JSON.stringify({ page: this.turn }) }
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
  function: {
    name: "read_page",
    description: "Read a page",
    parameters: { type: "object", properties: { page: { type: "number" } } }
  },
  handler: async ({ page }: { page: number }) => `Contents of page ${page}`
};

const toolResults = (request: ChatRequest) =>
  request.messages.filter((message) => message.role === "tool").map((message) => message.content);

describe("keepToolResults", () => {
  it("sends only the most recent tool results in full, and keeps the history whole", async () => {
    const provider = new PageReadingProvider(3);
    const chat = new Chat(provider, "test-model", { keepToolResults: 1 });

    await chat.withTool(readPage).ask("Read the pages");

    expect(toolResults(provider.requests[3]!)).toEqual([
      OMITTED_TOOL_RESULT,
      OMITTED_TOOL_RESULT,
      "Contents of page 3"
    ]);
    expect(
      chat.history.filter((message) => message.role === "tool").map((message) => message.content)
    ).toEqual(["Contents of page 1", "Contents of page 2", "Contents of page 3"]);
  });

  it("is set on an agent class like its other options", async () => {
    class Reader extends Agent {
      static keepToolResults = 2;
      static tools = [readPage];
    }
    const provider = new PageReadingProvider(3);
    const llm = { chat: (model: string, options: object) => new Chat(provider, model, options) };

    await new Reader({ llm: llm as never, model: "test-model" }).ask("Read the pages");

    expect(toolResults(provider.requests[3]!)).toEqual([
      OMITTED_TOOL_RESULT,
      "Contents of page 2",
      "Contents of page 3"
    ]);
  });

  it("leaves messages alone when it isn't set or there are fewer results", () => {
    const messages: Message[] = [
      { role: "user", content: "Read" },
      { role: "tool", tool_call_id: "call_1", content: "Page 1" }
    ];

    expect(windowToolResults(messages, undefined)).toBe(messages);
    expect(windowToolResults(messages, 3)).toBe(messages);
    expect(windowToolResults(messages, 0)[1]!.content).toBe(OMITTED_TOOL_RESULT);
  });
});
