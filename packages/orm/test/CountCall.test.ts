import { describe, it, expect } from "vitest";
import { Agent, CostLimitError, createLLM } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession, type AgentSession } from "../src/adapters/prisma/AgentSession.js";
import type { ChatStore, StoredMessage } from "../src/Store.js";

class MemoryStore implements ChatStore {
  messages: StoredMessage[] = [];
  requests: any[] = [];
  sessions = new Map<string, any>();
  private next = 0;
  private id(prefix: string) {
    this.next += 1;
    return `${prefix}-${this.next}`;
  }
  async createChat(chat: any) {
    return { ...chat, id: this.id("chat"), createdAt: new Date(), updatedAt: new Date() };
  }
  async findChat() {
    return null;
  }
  async deleteChat() {}
  async createMessage(message: { chatId: string; role: string; content: string | null }) {
    const record = { ...message, id: this.id("message"), createdAt: new Date() };
    this.messages.push(record);
    return record;
  }
  async updateMessage(id: string, changes: any) {
    return Object.assign(this.messages.find((m) => m.id === id)!, changes);
  }
  async deleteMessage(id: string) {
    this.messages = this.messages.filter((m) => m.id !== id);
  }
  async listMessages(chatId: string) {
    return this.messages.filter((m) => m.chatId === chatId);
  }
  async createToolCall() {}
  async finishToolCall() {}
  async createRequest(request: any) {
    this.requests.push(request);
  }
  async requestTotals(chatId: string) {
    const rows = this.requests.filter((r) => r.chatId === chatId);
    return {
      inputTokens: rows.reduce((sum, r) => sum + r.inputTokens, 0),
      outputTokens: rows.reduce((sum, r) => sum + r.outputTokens, 0),
      cost: rows.reduce((sum, r) => sum + r.cost, 0)
    };
  }
  async createAgentSession(session: any) {
    const record = {
      ...session,
      id: this.id("session"),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.set(record.id, record);
    return record;
  }
  async findAgentSession(id: string) {
    return this.sessions.get(id) ?? null;
  }
  async updateAgentSession() {}
}

// One look at the page, then an answer; each request costs $0.01.
class Looking implements Provider {
  id = "scripted";
  requests = 0;
  constructor(private looks = 1) {}
  defaultModel() {
    return "test-model";
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    this.requests++;
    const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 };
    if (this.requests > this.looks) return { content: "Found it.", usage };
    return {
      content: null,
      usage,
      tool_calls: [
        { id: `c${this.requests}`, type: "function", function: { name: "look", arguments: "{}" } }
      ]
    };
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

// The answer of another model asked about a picture.
const pictureAnswer = {
  usage: { input_tokens: 1000, output_tokens: 20, total_tokens: 1020, cost: 0.05 },
  model: "vision-model",
  provider: "scripted",
  latency: 300
};

let session: AgentSession;
const look = {
  type: "function" as const,
  function: { name: "look", description: "Look", parameters: { type: "object", properties: {} } },
  handler: async () => {
    await session.countCall(pictureAnswer);
    return "a button";
  }
};

class Explorer extends Agent {
  static model = "test-model";
  static tools = [look];
  static assumeModelExists = true;
}

describe("countCall", () => {
  it("records a side call as a request of the answer being written, and counts it", async () => {
    const store = new MemoryStore();
    session = await createAgentSession(store, createLLM({ provider: new Looking() }), Explorer);

    const answer = await session.ask("Find the button");

    expect(store.requests).toContainEqual(
      expect.objectContaining({
        chatId: session.chatId,
        messageId: answer.id,
        model: "vision-model",
        duration: 300,
        inputTokens: 1000,
        cost: 0.05
      })
    );
    expect((await session.stats()).cost).toBeCloseTo(0.07);
    expect(session.totalUsage.cost).toBeCloseTo(0.07);
  });

  it("counts toward the agent's maxCost", async () => {
    const provider = new Looking(10);
    class BudgetExplorer extends Explorer {
      static maxCost = 0.1;
      static maxToolCalls = 20;
    }
    session = await createAgentSession(new MemoryStore(), createLLM({ provider }), BudgetExplorer);

    await expect(session.ask("Find the button")).rejects.toBeInstanceOf(CostLimitError);
    expect(provider.requests).toBe(3);
  });
});
