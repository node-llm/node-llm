import { describe, it, expect, beforeEach, vi } from "vitest";
import { createChat } from "../src/adapters/prisma/index.js";

// Mock Prisma Client
const createMockPrisma = () => {
  const messages: any[] = [];
  const chats: any[] = [];

  const tables: any = {
    chat: {
      create: vi.fn(async ({ data }) => {
        const chat = { id: "chat-123", ...data, createdAt: new Date(), updatedAt: new Date() };
        chats.push(chat);
        return chat;
      })
    },
    message: {
      create: vi.fn(async ({ data }) => {
        const message = { id: `msg-${messages.length}`, ...data, createdAt: new Date() };
        messages.push(message);
        return message;
      }),
      findMany: vi.fn(async ({ where }) => {
        let filtered = messages.filter((m) => m.chatId === where.chatId);
        if (where.id?.notIn) {
          filtered = filtered.filter((m) => !where.id.notIn.includes(m.id));
        }
        return filtered;
      }),
      update: vi.fn(async ({ where, data }) => {
        const message = messages.find((m) => m.id === where.id);
        if (message) {
          Object.assign(message, data);
        }
        return message;
      }),
      delete: vi.fn()
    },
    toolCall: {
      create: vi.fn(),
      update: vi.fn()
    },
    request: {
      create: vi.fn()
    }
  };

  return new Proxy(tables, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === "string") {
        if (prop.toLowerCase().includes("chat")) return target.chat;
        if (prop.toLowerCase().includes("message")) return target.message;
        if (prop.toLowerCase().includes("toolcall")) return target.toolCall;
        if (prop.toLowerCase().includes("request")) return target.request;
      }
      return undefined;
    }
  });
};

// Mock NodeLLM capturing everything passed/registered on the core chat
const createMockLLM = () => {
  let capturedOptions: any;
  let capturedSchema: any;

  const mockChat: any = {
    withTools: vi.fn(() => mockChat),
    withSchema: vi.fn((schema) => {
      capturedSchema = schema;
      return mockChat;
    }),
    onToolCallStart: vi.fn(() => mockChat),
    onToolCallEnd: vi.fn(() => mockChat),
    onToolCallError: vi.fn(() => mockChat),
    onConfirmToolCall: vi.fn(() => mockChat),
    afterResponse: vi.fn(() => mockChat),
    onNewMessage: vi.fn(() => mockChat),
    onEndMessage: vi.fn(() => mockChat),
    beforeRequest: vi.fn(() => mockChat),
    ask: vi.fn(async () => ({
      content: "Test response",
      meta: {},
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
      model: "gpt-4o-mini",
      provider: "openai"
    }))
  };

  const llm: any = {
    chat: vi.fn((_model, options) => {
      capturedOptions = options;
      return mockChat;
    }),
    withProvider: vi.fn(() => llm),
    getCapturedOptions: () => capturedOptions,
    getCapturedSchema: () => capturedSchema
  };

  return llm;
};

describe("ORM toolChoice/toolCalls/schema options", () => {
  let mockPrisma: any;
  let mockLLM: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockLLM = createMockLLM();
  });

  it("forwards toolChoice to the underlying core chat", async () => {
    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      toolChoice: { type: "function", function: { name: "get_weather" } }
    });

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(
      expect.objectContaining({
        toolChoice: { type: "function", function: { name: "get_weather" } }
      })
    );
  });

  it("forwards toolCalls to the underlying core chat", async () => {
    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      toolCalls: "one"
    });

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(expect.objectContaining({ toolCalls: "one" }));
  });

  it("supports withToolChoice/withToolCalls fluent methods", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    chat.withToolChoice("required").withToolCalls(1);

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(
      expect.objectContaining({ toolChoice: "required", toolCalls: 1 })
    );
  });

  it("applies a schema passed at createChat() time via withSchema(), not the raw options spread", async () => {
    const schema = { name: "output", shape: {} };
    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      schema
    });

    await chat.ask("Hello");

    // schema must NOT be forwarded raw (core doesn't normalize it outside withSchema())
    expect(mockLLM.getCapturedOptions().schema).toBeUndefined();
    expect(mockLLM.getCapturedSchema()).toBe(schema);
  });

  it("applies a schema set via the fluent withSchema() method", async () => {
    const schema = { name: "output", shape: {} };
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    chat.withSchema(schema);

    await chat.ask("Hello");

    expect(mockLLM.getCapturedSchema()).toBe(schema);
  });

  it("does not call withSchema when no schema is configured", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    await chat.ask("Hello");

    const mockChat = mockLLM.chat.mock.results[0].value;
    expect(mockChat.withSchema).not.toHaveBeenCalled();
  });
});
