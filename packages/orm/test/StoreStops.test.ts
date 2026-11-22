import { describe, it, expect } from "vitest";
import { Agent, createLLM } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession } from "../src/adapters/prisma/AgentSession.js";
import { createChat } from "../src/adapters/prisma/Chat.js";
import { StoppedByStoreError } from "../src/index.js";
import type { ChatStore, NewRequest, RequestRecorded, StoredMessage } from "../src/Store.js";

// Says to stop once it has recorded `limit` requests, as a store that keeps a monthly budget might.
class BudgetStore implements ChatStore {
  messages: StoredMessage[] = [];
  requests: NewRequest[] = [];
  toolCalls: any[] = [];
  sessions = new Map<string, any>();
  private next = 0;
  constructor(private limit: number) {}
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
  async listMessages(chatId: string, options: { excludeIds?: string[] } = {}) {
    return this.messages.filter((m) => m.chatId === chatId && !options.excludeIds?.includes(m.id));
  }
  async createToolCall(call: any) {
    this.toolCalls.push(call);
  }
  async finishToolCall() {}
  async createRequest(request: NewRequest): Promise<RequestRecorded | void> {
    this.requests.push(request);
    if (this.requests.length >= this.limit) return { stop: "The monthly AI limit is reached." };
  }
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

// Calls `look` a few times, then answers.
class Looking implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  constructor(private looks = 5) {}
  defaultModel() {
    return "test-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push(request);
    const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };
    if (this.requests.length > this.looks) return { content: "Done.", usage };
    return {
      content: null,
      usage,
      tool_calls: [
        {
          id: `c${this.requests.length}`,
          type: "function",
          function: { name: "look", arguments: "{}" }
        }
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
  static maxToolCalls = 20;
  static assumeModelExists = true;
}

describe("a store that stops a run", () => {
  it("stops an agent session before its next request, with the store's reason", async () => {
    const store = new BudgetStore(2);
    const provider = new Looking();
    const session = await createAgentSession(store, createLLM({ provider }), Explorer);

    const error = await session.ask("Explore").catch((caught) => caught);

    expect(error).toBeInstanceOf(StoppedByStoreError);
    expect(error).toMatchObject({
      reason: "The monthly AI limit is reached.",
      code: "STOPPED_BY_STORE",
      message: "The monthly AI limit is reached."
    });
    expect(provider.requests).toHaveLength(2);
    // The tool call the second answer asked for ran, so the history stays valid.
    expect(session.history.filter((m) => m.role === "tool")).toHaveLength(2);
  });

  it("stops the session's next ask too", async () => {
    const provider = new Looking(0);
    const session = await createAgentSession(new BudgetStore(1), createLLM({ provider }), Explorer);
    await session.ask("Hello");

    await expect(session.ask("Again")).rejects.toBeInstanceOf(StoppedByStoreError);
    expect(provider.requests).toHaveLength(1);
  });

  it("stops a chat too", async () => {
    const provider = new Looking();
    const chat = await createChat(new BudgetStore(3), createLLM({ provider }), {
      model: "test-model",
      assumeModelExists: true,
      maxToolCalls: 20
    } as any);

    await expect(chat.withTool(look as any).ask("Explore")).rejects.toBeInstanceOf(
      StoppedByStoreError
    );
    expect(provider.requests).toHaveLength(3);
  });

  it("carries on when the store answers nothing", async () => {
    const provider = new Looking(1);
    const session = await createAgentSession(
      new BudgetStore(100),
      createLLM({ provider }),
      Explorer
    );

    expect((await session.ask("Explore")).content).toBe("Done.");
  });
});

describe("a store and subagents", () => {
  // The lead sends three workers through run_agents, one at a time; workers answer at once.
  class Fanning implements Provider {
    id = "scripted";
    requests: ChatRequest[] = [];
    defaultModel() {
      return "test-model";
    }
    async chat(request: ChatRequest): Promise<ChatResponse> {
      this.requests.push(request);
      const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 };
      const system = String(request.messages.find((m) => m.role === "system")?.content ?? "");
      const last = request.messages[request.messages.length - 1];
      if (system === "Lead" && last?.role !== "tool") {
        const tasks = ["a", "b", "c"].map((task) => ({ agent: "look", task }));
        return {
          content: null,
          usage,
          tool_calls: [
            {
              id: "fan",
              type: "function",
              function: { name: "run_agents", arguments: JSON.stringify({ tasks }) }
            }
          ]
        };
      }
      return { content: last?.role === "tool" ? String(last.content) : "looked", usage };
    }
    formatToolResultMessage(toolCallId: string, content: string): Message {
      return { role: "tool", tool_call_id: toolCallId, content };
    }
  }

  async function leadSession(limit: number) {
    const { agentsTool } = await import("@node-llm/core");
    const provider = new Fanning();
    const llm = createLLM({ provider });
    class Look extends Agent {
      static model = "test-model";
      static instructions = "Look";
      static assumeModelExists = true;
    }
    class Lead extends Agent {
      static model = "test-model";
      static instructions = "Lead";
      static assumeModelExists = true;
      static tools = [agentsTool({ agents: { look: Look }, llm, concurrency: 1 })];
    }
    const store = new BudgetStore(limit);
    const session = await createAgentSession(store, llm, Lead);
    return { store, session, provider };
  }

  it("records each worker's request under the lead's answer", async () => {
    const { store, session } = await leadSession(100);
    await session.ask("Look at the app");
    // The lead's two requests and the three workers'.
    expect(store.requests).toHaveLength(5);
    expect(store.requests.every((r) => r.cost === 0.01)).toBe(true);
  });

  it("stops the workers when the store says stop", async () => {
    const { store, session, provider } = await leadSession(2);
    const error = await session.ask("Look at the app").catch((caught) => caught);
    // Lead request 1, worker a's request 2 says stop: b and c are stopped, then the lead.
    expect(error).toBeInstanceOf(StoppedByStoreError);
    expect(provider.requests).toHaveLength(2);
    const result = JSON.parse(
      String(session.history.find((m) => m.role === "tool")?.content ?? "[]")
    );
    expect(result.map((r: { status: string }) => r.status)).toEqual(["done", "failed", "failed"]);
    expect(store.requests).toHaveLength(2);
  });
});
