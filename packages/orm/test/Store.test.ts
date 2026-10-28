import { describe, it, expect } from "vitest";
import { Agent, NodeLLM } from "@node-llm/core";
import { createChat, loadChat } from "../src/adapters/prisma/Chat.js";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession.js";
import { isChatStore, type ChatStore, type StoredMessage } from "../src/Store.js";

// Keeps everything in memory, as an app's own store might keep it behind an HTTP API.
class MemoryStore implements ChatStore {
  chats = new Map<string, any>();
  messages: StoredMessage[] = [];
  toolCalls: any[] = [];
  requests: any[] = [];
  sessions = new Map<string, any>();
  private next = 0;

  private id(prefix: string) {
    this.next += 1;
    return `${prefix}-${this.next}`;
  }

  async createChat(chat: any) {
    const record = { ...chat, id: this.id("chat"), createdAt: new Date(), updatedAt: new Date() };
    this.chats.set(record.id, record);
    return record;
  }

  async findChat(id: string) {
    return this.chats.get(id) ?? null;
  }

  async deleteChat(id: string) {
    this.chats.delete(id);
    this.messages = this.messages.filter((message) => message.chatId !== id);
  }

  async createMessage(message: { chatId: string; role: string; content: string | null }) {
    const record = { ...message, id: this.id("message"), createdAt: new Date() };
    this.messages.push(record);
    return record;
  }

  async updateMessage(id: string, changes: any) {
    const record = this.messages.find((message) => message.id === id)!;
    Object.assign(record, changes);
    return record;
  }

  async deleteMessage(id: string) {
    this.messages = this.messages.filter((message) => message.id !== id);
  }

  async listMessages(chatId: string, options: { excludeIds?: string[] } = {}) {
    return this.messages.filter(
      (message) => message.chatId === chatId && !options.excludeIds?.includes(message.id)
    );
  }

  async createToolCall(toolCall: any) {
    this.toolCalls.push({ ...toolCall });
  }

  async finishToolCall(messageId: string, toolCallId: string, finished: any) {
    const record = this.toolCalls.find(
      (call) => call.messageId === messageId && call.toolCallId === toolCallId
    );
    Object.assign(record, finished);
  }

  async createRequest(request: any) {
    this.requests.push(request);
  }

  async requestTotals(chatId: string) {
    const requests = this.requests.filter((request) => request.chatId === chatId);
    return {
      inputTokens: requests.reduce((sum, request) => sum + request.inputTokens, 0),
      outputTokens: requests.reduce((sum, request) => sum + request.outputTokens, 0),
      cost: requests.reduce((sum, request) => sum + request.cost, 0)
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

  async updateAgentSession(id: string, changes: { metadata: Record<string, unknown> }) {
    Object.assign(this.sessions.get(id), changes);
  }
}

// A model that calls one tool, then answers: it fires the hooks a real chat fires, in order.
const fakeLlm = () => {
  const chat: any = {};
  const hooks: Record<string, (...args: any[]) => any> = {};
  for (const hook of [
    "onToolCallStart",
    "onToolCallEnd",
    "afterResponse",
    "onToolCallError",
    "onEndMessage",
    "beforeRequest",
    "onNewMessage",
    "onConfirmToolCall"
  ]) {
    chat[hook] = (callback: (...args: any[]) => any) => {
      hooks[hook] = callback;
      return chat;
    };
  }
  Object.assign(chat, {
    withTools: () => chat,
    withSchema: () => chat,
    withInstructions: () => chat,
    history: [],
    totalUsage: { input_tokens: 0, output_tokens: 0 },
    modelId: "fake-model",
    ask: async () => {
      const call = { id: "call-1", function: { name: "lookup", arguments: '{"sku":"PEN"}' } };
      await hooks.onToolCallStart?.(call);
      await hooks.onToolCallEnd?.(call, "4 in stock");
      const response = {
        content: "There are 4 pens.",
        meta: {},
        model: "fake-model",
        provider: "fake",
        latency: 120,
        usage: { input_tokens: 30, output_tokens: 8, cost: 0.002 }
      };
      await hooks.afterResponse?.(response);
      return response;
    }
  });
  return {
    chat: () => chat,
    withProvider: () => ({ chat: () => chat })
  } as unknown as typeof NodeLLM;
};

class StockAgent extends Agent {
  static model = "fake-model";
  static instructions = "Answer stock questions.";
}

describe("A custom ChatStore", () => {
  it("records a chat's messages, tool calls and requests in the store", async () => {
    const store = new MemoryStore();

    const chat = await createChat(store, fakeLlm(), { model: "fake-model", userId: "user-1" });
    const answer = await chat.ask("How many pens?");

    expect(store.chats.get(chat.id)).toMatchObject({ model: "fake-model", userId: "user-1" });
    expect(answer.content).toBe("There are 4 pens.");
    expect(store.messages.map((message) => [message.role, message.content])).toEqual([
      ["user", "How many pens?"],
      ["assistant", "There are 4 pens."]
    ]);
    expect(store.toolCalls).toEqual([
      expect.objectContaining({ toolCallId: "call-1", name: "lookup", result: "4 in stock" })
    ]);
    expect(store.requests).toEqual([
      expect.objectContaining({ provider: "fake", duration: 120, inputTokens: 30, outputTokens: 8 })
    ]);
    expect(await chat.stats()).toEqual({
      input_tokens: 30,
      output_tokens: 8,
      total_tokens: 38,
      cost: 0.002
    });
    expect(await loadChat(store, fakeLlm(), chat.id)).not.toBeNull();
  });

  it("records an agent session, with tools given for the session and real request durations", async () => {
    const store = new MemoryStore();
    const lookup = { name: "lookup" };
    let given: any;
    class WatchedAgent extends StockAgent {
      constructor(overrides: any) {
        super(overrides);
        given = overrides;
      }
    }

    const session = await createAgentSession(store, fakeLlm(), WatchedAgent, {
      metadata: { team: "stock" },
      tools: [lookup as any]
    });
    await session.ask("How many pens?");

    expect(given.tools).toEqual([lookup]);
    expect(store.sessions.get(session.id)).toMatchObject({ agentClass: "WatchedAgent" });
    expect(store.requests).toEqual([
      expect.objectContaining({ chatId: session.chatId, duration: 120 })
    ]);

    const loaded = await loadAgentSession(store, fakeLlm(), WatchedAgent, session.id);
    expect(loaded?.chatId).toBe(session.chatId);
  });

  it("tells a store from a Prisma client", () => {
    expect(isChatStore(new MemoryStore())).toBe(true);
    expect(isChatStore({ llmChat: { create: () => {} } })).toBe(false);
  });
});
