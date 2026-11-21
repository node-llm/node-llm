import { describe, it, expect } from "vitest";
import { Agent, createLLM, Tool, z } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession.js";
import { storedHistory } from "../src/history.js";
import type { ChatStore, StoredMessage, StoredToolCall } from "../src/Store.js";

// A store kept in memory, as an app might keep its records behind its own API.
class MemoryStore implements ChatStore {
  messages: StoredMessage[] = [];
  toolCalls: StoredToolCall[] = [];
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
  async createToolCall(toolCall: any) {
    this.toolCalls.push({ ...toolCall, result: null });
  }
  async finishToolCall(messageId: string, toolCallId: string, finished: any) {
    Object.assign(
      this.toolCalls.find((c) => c.messageId === messageId && c.toolCallId === toolCallId)!,
      finished
    );
  }
  async listToolCalls(messageIds: string[]) {
    return this.toolCalls.filter((c) => messageIds.includes(c.messageId));
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
}

const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };

class ScriptedProvider implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  constructor(private responses: ChatResponse[]) {}
  defaultModel() {
    return "test-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({ ...request, messages: [...request.messages] });
    const response = this.responses.shift();
    if (!response) throw new Error("No more responses");
    return response;
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const call = (id: string, name: string, args: string): ChatResponse => ({
  content: null,
  usage,
  tool_calls: [{ id, type: "function", function: { name, arguments: args } }]
});

// The service "restarts" while the second page is being read: the tool never returns.
let crash = false;
class ReadPage extends Tool<{ url: string }> {
  name = "read_page";
  description = "Read a page";
  schema = z.object({ url: z.string() });
  async execute({ url }: { url: string }) {
    if (crash && url === "/pricing") return new Promise<string>(() => {});
    return `contents of ${url}`;
  }
}

class Researcher extends Agent {
  static model = "test-model";
  static instructions = "Research the site.";
  static tools = [ReadPage];
  static assumeModelExists = true;
}

const roles = (messages: Message[]) =>
  messages.map((m) => (m.tool_calls ? `assistant:${m.tool_calls.map((c) => c.id)}` : m.role));

describe("resuming an agent session after its service restarts", () => {
  it("gives the model the tool calls and results it already had, without the unfinished call", async () => {
    const store = new MemoryStore();
    crash = true;
    const first = new ScriptedProvider([
      call("c1", "read_page", '{"url":"/home"}'),
      call("c2", "read_page", '{"url":"/pricing"}')
    ]);
    const session = await createAgentSession(store, createLLM({ provider: first }), Researcher);
    void session.ask("Summarise the site");
    await vi_waitFor(() => store.toolCalls.length === 2);

    // A new process loads the session from the store and asks it to carry on.
    crash = false;
    const second = new ScriptedProvider([
      call("c3", "read_page", '{"url":"/pricing"}'),
      { content: "A pen shop.", usage }
    ]);
    const resumed = await loadAgentSession(
      store,
      createLLM({ provider: second }),
      Researcher,
      session.id
    );
    const answer = await resumed!.ask("Continue where you left off.");

    expect(answer.content).toBe("A pen shop.");
    const sent = second.requests[0].messages;
    expect(roles(sent)).toEqual(["system", "user", "assistant:c1", "tool", "user"]);
    expect(sent[3]).toMatchObject({ tool_call_id: "c1", content: "contents of /home" });
    expect(sent[2].tool_calls![0]).toMatchObject({
      type: "function",
      function: { name: "read_page", arguments: '{"url":"/home"}' }
    });
  });

  it("keeps finished turns' tool calls before their answers", () => {
    const at = new Date();
    const messages: StoredMessage[] = [
      { id: "m1", chatId: "c", role: "user", content: "How many pens?", createdAt: at },
      { id: "m2", chatId: "c", role: "assistant", content: "4 pens.", createdAt: at },
      { id: "m3", chatId: "c", role: "user", content: "And pencils?", createdAt: at },
      { id: "m4", chatId: "c", role: "assistant", content: "No pencils.", createdAt: at }
    ];
    const toolCalls: StoredToolCall[] = [
      { messageId: "m2", toolCallId: "a", name: "stock", arguments: '{"sku":"PEN"}', result: "4" },
      {
        messageId: "m2",
        toolCallId: "b",
        name: "stock",
        arguments: '{"sku":"INK"}',
        result: "0",
        thoughtSignature: "sig"
      },
      {
        messageId: "m4",
        toolCallId: "c",
        name: "stock",
        arguments: '{"sku":"PENCIL"}',
        result: "0"
      }
    ];

    const history = storedHistory(messages, toolCalls);

    expect(roles(history)).toEqual([
      "user",
      "assistant:a,b",
      "tool",
      "tool",
      "assistant",
      "user",
      "assistant:c",
      "tool",
      "assistant"
    ]);
    expect(history[1].tool_calls![1]).toMatchObject({ id: "b", thought_signature: "sig" });
    expect(history[4]).toEqual({ role: "assistant", content: "4 pens." });
  });

  it("leaves out an assistant message with no text and no finished calls", () => {
    const at = new Date();
    const history = storedHistory(
      [
        { id: "m1", chatId: "c", role: "user", content: "Hi", createdAt: at },
        { id: "m2", chatId: "c", role: "assistant", content: null, createdAt: at }
      ],
      [{ messageId: "m2", toolCallId: "x", name: "slow", arguments: "{}", result: null }]
    );

    expect(history).toEqual([{ role: "user", content: "Hi" }]);
  });

  it("gives only the messages' text when the store can't list tool calls", async () => {
    const store = new MemoryStore();
    (store as Partial<MemoryStore>).listToolCalls = undefined;
    const provider = new ScriptedProvider([{ content: "Hello again.", usage }]);
    const session = await createAgentSession(store, createLLM({ provider }), Researcher);
    store.messages.push(
      { id: "u", chatId: session.chatId, role: "user", content: "Hi", createdAt: new Date() },
      { id: "a", chatId: session.chatId, role: "assistant", content: null, createdAt: new Date() }
    );

    const resumed = await loadAgentSession(store, createLLM({ provider }), Researcher, session.id);
    await resumed!.ask("Still there?");

    expect(roles(provider.requests[0].messages)).toEqual(["system", "user", "user"]);
  });
});

async function vi_waitFor(condition: () => boolean) {
  for (let i = 0; i < 100 && !condition(); i++) await new Promise((r) => setTimeout(r, 5));
  if (!condition()) throw new Error("timed out");
}
