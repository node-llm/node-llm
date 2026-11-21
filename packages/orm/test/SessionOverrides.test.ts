import { describe, it, expect } from "vitest";
import { Agent, CostLimitError, createLLM } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession.js";
import type { ChatStore, StoredMessage } from "../src/Store.js";

class MemoryStore implements ChatStore {
  messages: StoredMessage[] = [];
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
  async createRequest() {}
  async requestTotals() {
    return { inputTokens: 0, outputTokens: 0, cost: 0 };
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

// Calls a tool forever, each request costing $0.01.
class Looping implements Provider {
  id = "scripted";
  calls = 0;
  defaultModel() {
    return "test-model";
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    this.calls++;
    return {
      content: null,
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 },
      tool_calls: [
        { id: `c${this.calls}`, type: "function", function: { name: "look", arguments: "{}" } }
      ]
    };
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const look = {
  type: "function" as const,
  function: { name: "look", description: "Look", parameters: { type: "object", properties: {} } },
  handler: async () => "a page"
};

class Explorer extends Agent {
  static model = "test-model";
  static tools = [look];
  static maxToolCalls = 100;
  static assumeModelExists = true;
}

describe("agent settings for one session", () => {
  it("applies the session's maxCost in place of the class's", async () => {
    const provider = new Looping();
    const session = await createAgentSession(new MemoryStore(), createLLM({ provider }), Explorer, {
      maxCost: 0.03
    });

    await expect(session.ask("Explore")).rejects.toBeInstanceOf(CostLimitError);
    expect(provider.calls).toBe(3);
  });

  it("applies them again when the session is loaded", async () => {
    const store = new MemoryStore();
    const created = await createAgentSession(
      store,
      createLLM({ provider: new Looping() }),
      Explorer
    );
    const provider = new Looping();

    const loaded = await loadAgentSession(store, createLLM({ provider }), Explorer, created.id, {
      maxToolCalls: 2
    });

    await expect(loaded!.ask("Explore")).rejects.toMatchObject({ limit: 2 });
  });

  it("keeps the class's settings when none are given", async () => {
    const provider = new Looping();
    const session = await createAgentSession(new MemoryStore(), createLLM({ provider }), Explorer, {
      maxToolCalls: undefined,
      maxCost: 0.02
    });

    await expect(session.ask("Explore")).rejects.toBeInstanceOf(CostLimitError);
    expect(provider.calls).toBe(2);
  });
});
