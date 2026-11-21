import { describe, it, expect } from "vitest";
import { Agent, createLLM } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession } from "../src/adapters/prisma/AgentSession.js";
import { createChat } from "../src/adapters/prisma/Chat.js";
import { maskSecrets, redactingStore } from "../src/redact.js";
import type { ChatStore, StoredMessage } from "../src/Store.js";

class MemoryStore implements ChatStore {
  messages: StoredMessage[] = [];
  toolCalls: any[] = [];
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
  async listMessages(chatId: string, options: { excludeIds?: string[] } = {}) {
    return this.messages.filter((m) => m.chatId === chatId && !options.excludeIds?.includes(m.id));
  }
  async createToolCall(toolCall: any) {
    this.toolCalls.push({ ...toolCall });
  }
  async finishToolCall(messageId: string, toolCallId: string, finished: any) {
    Object.assign(
      this.toolCalls.find((c) => c.messageId === messageId && c.toolCallId === toolCallId),
      finished
    );
  }
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
  /** A method of the app's own, beyond ChatStore */
  countMessages() {
    return this.messages.length;
  }
}

const KEY = "sk-proj-abcdefghijklmnopqrstuvwx";
const usage = { input_tokens: 1, output_tokens: 1, total_tokens: 2 };

class Scripted implements Provider {
  id = "scripted";
  constructor(private replies: ChatResponse[]) {}
  defaultModel() {
    return "test-model";
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    return this.replies.shift()!;
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const connect = {
  type: "function" as const,
  function: {
    name: "connect",
    description: "Connect",
    parameters: { type: "object", properties: { url: { type: "string" } } }
  },
  handler: async () => `connected with ${KEY}`
};

class Ops extends Agent {
  static model = "test-model";
  static tools = [connect];
  static assumeModelExists = true;
}

describe("saving conversations", () => {
  it("masks keys and URL passwords in messages, tool arguments and results", async () => {
    const store = new MemoryStore();
    const provider = new Scripted([
      {
        content: null,
        usage,
        tool_calls: [
          {
            id: "c1",
            type: "function",
            function: {
              name: "connect",
              arguments: JSON.stringify({ url: "postgres://admin:hunter2@db/app" })
            }
          }
        ]
      },
      { content: `Done. Your key is ${KEY}.`, usage }
    ]);
    const session = await createAgentSession(store, createLLM({ provider }), Ops);

    await session.ask(`Connect using ${KEY}`);

    expect(store.messages.map((m) => m.content)).toEqual([
      "Connect using [REDACTED]",
      "Done. Your key is [REDACTED]."
    ]);
    expect(store.toolCalls[0]).toMatchObject({
      arguments: '{"url":"postgres://admin:[REDACTED]@db/app"}',
      result: "connected with [REDACTED]"
    });
    // The tool call arguments stay valid JSON.
    expect(JSON.parse(store.toolCalls[0].arguments).url).toBe("postgres://admin:[REDACTED]@db/app");
  });

  it("applies the app's own redact after masking keys", async () => {
    const store = new MemoryStore();
    const provider = new Scripted([{ content: "Call Jane on 555-0100.", usage }]);
    const chat = await createChat(store, createLLM({ provider }), {
      model: "test-model",
      assumeModelExists: true,
      redact: (text: string) => text.replace(/Jane/g, "[NAME]")
    } as any);

    await chat.ask("Who do I call?");

    expect(store.messages.map((m) => m.content)).toEqual([
      "Who do I call?",
      "Call [NAME] on 555-0100."
    ]);
  });

  it("leaves ordinary text, reads and the store's own methods as they were", async () => {
    const store = new MemoryStore();
    const wrapped = redactingStore(store) as MemoryStore;
    await wrapped.createMessage({ chatId: "c", role: "user", content: "Order 42 shipped" });

    expect((await wrapped.listMessages("c"))[0]!.content).toBe("Order 42 shipped");
    expect(wrapped.countMessages()).toBe(1);
    expect(redactingStore(wrapped)).toBe(wrapped);
  });
});

describe("maskSecrets", () => {
  it("masks common key formats", () => {
    expect(
      maskSecrets(
        `a ${KEY} b AIzaSyA1234567890abcdefghijklmnopqrstu c Bearer abcdefghijklmnopqrstuvwxyz`
      )
    ).toBe("a [REDACTED] b [REDACTED] c [REDACTED]");
  });
});
