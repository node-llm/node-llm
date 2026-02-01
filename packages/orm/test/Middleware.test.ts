import { describe, it, expect, beforeEach, vi } from "vitest";
import { createChat } from "../src/adapters/prisma/index.js";
import { Middleware } from "@node-llm/core";

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
    },
    _messages: messages
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

// Mock NodeLLM with middleware support
const createMockLLM = () => {
  let capturedMiddlewares: Middleware[] = [];

  const mockChat: any = {
    system: vi.fn(() => mockChat),
    withTools: vi.fn(() => mockChat),
    onToolCallStart: vi.fn(() => mockChat),
    onToolCallEnd: vi.fn(() => mockChat),
    afterResponse: vi.fn(() => mockChat),
    onNewMessage: vi.fn(() => mockChat),
    onEndMessage: vi.fn(() => mockChat),
    beforeRequest: vi.fn(() => mockChat),
    ask: vi.fn(async () => {
      return {
        content: "Test response",
        meta: { model: "gpt-4o-mini", provider: "openai" },
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        model: "gpt-4o-mini",
        provider: "openai"
      };
    })
  };

  const llm: any = {
    chat: vi.fn((model, options) => {
      if (options?.middlewares) {
        capturedMiddlewares = options.middlewares;
      }
      return mockChat;
    }),
    withProvider: vi.fn(() => llm),
    getMiddlewares: () => capturedMiddlewares
  };

  return llm;
};

describe("ORM Middleware Integration", () => {
  let mockPrisma: any;
  let mockLLM: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockLLM = createMockLLM();
  });

  it("should pass middlewares to core Chat instance", async () => {
    const middleware: Middleware = {
      name: "TestMiddleware",
      onRequest: vi.fn()
    };

    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      middlewares: [middleware]
    });

    // Middlewares are passed when ask() is called
    await chat.ask("Hello");

    // Verify chat was created with middlewares
    expect(mockLLM.chat).toHaveBeenCalledWith(
      "gpt-4o-mini",
      expect.objectContaining({
        middlewares: [middleware]
      })
    );

    const captured = mockLLM.getMiddlewares();
    expect(captured).toHaveLength(1);
    expect(captured[0].name).toBe("TestMiddleware");
  });
});
