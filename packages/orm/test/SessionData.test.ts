import { describe, it, expect } from "vitest";
import { Agent, createLLM, z } from "@node-llm/core";
import type { ChatRequest, ChatResponse, Message, Provider } from "@node-llm/core";
import { createAgentSession } from "../src/adapters/prisma/AgentSession.js";
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

const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };
class OneAnswer implements Provider {
  id = "scripted";
  constructor(private content: string) {}
  defaultModel() {
    return "test-model";
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    return { content: this.content, usage };
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const proposal = z.object({ action: z.enum(["click", "fill"]), target: z.string() });

class Repairer extends Agent<Record<string, never>, z.infer<typeof proposal>> {
  static model = "test-model";
  static instructions = "Propose a repair.";
  static schema = proposal;
  static assumeModelExists = true;
}

describe("an agent session's answer", () => {
  it("has the parsed data, found inside a code fence", async () => {
    const llm = createLLM({
      provider: new OneAnswer('Here it is:\n```json\n{"action":"click","target":"Save"}\n```')
    });
    const session = await createAgentSession(new MemoryStore(), llm, Repairer);

    const answer = await session.ask("The Save button moved.");

    expect(answer.data).toEqual({ action: "click", target: "Save" });
    expect(answer.data.action).toBe("click");
    // @ts-expect-error data is typed from the schema
    void answer.data.missing;
    // The saved record is unchanged: data is not a column.
    expect(Object.keys(answer)).not.toContain("data");
    expect(JSON.parse(JSON.stringify(answer))).not.toHaveProperty("data");
  });

  it("throws the schema's readable error when the answer doesn't match", async () => {
    const llm = createLLM({ provider: new OneAnswer('{"action":"hover","target":"Save"}') });
    const session = await createAgentSession(new MemoryStore(), llm, Repairer);

    const answer = await session.ask("The Save button moved.");

    expect(() => answer.data).toThrow(/action/);
    expect(answer.content).toBe('{"action":"hover","target":"Save"}');
  });
});
