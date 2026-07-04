import { describe, it, expect, beforeEach, vi } from "vitest";
import { createChat } from "../src/adapters/prisma/index.js";
import { ToolExecutionMode } from "@node-llm/core";

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
  let capturedErrorHandler: ((call: any, error: Error) => any) | undefined;
  let capturedConfirmHandler: ((call: any) => any) | undefined;

  const mockChat: any = {
    withTools: vi.fn(() => mockChat),
    onToolCallStart: vi.fn(() => mockChat),
    onToolCallEnd: vi.fn(() => mockChat),
    onToolCallError: vi.fn((handler) => {
      capturedErrorHandler = handler;
      return mockChat;
    }),
    onConfirmToolCall: vi.fn((handler) => {
      capturedConfirmHandler = handler;
      return mockChat;
    }),
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
    getErrorHandler: () => capturedErrorHandler,
    getConfirmHandler: () => capturedConfirmHandler
  };

  return llm;
};

describe("ORM tool execution options", () => {
  let mockPrisma: any;
  let mockLLM: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockLLM = createMockLLM();
  });

  it("forwards toolConcurrency to the underlying core chat", async () => {
    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      toolConcurrency: true
    });

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(
      expect.objectContaining({ toolConcurrency: true })
    );
  });

  it("forwards toolExecution mode to the underlying core chat", async () => {
    const chat = await createChat(mockPrisma, mockLLM, {
      model: "gpt-4o-mini",
      toolExecution: ToolExecutionMode.CONFIRM
    });

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(
      expect.objectContaining({ toolExecution: ToolExecutionMode.CONFIRM })
    );
  });

  it("supports withToolConcurrency/withToolExecution fluent methods", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    chat.withToolConcurrency(true).withToolExecution(ToolExecutionMode.DRY_RUN);

    await chat.ask("Hello");

    expect(mockLLM.getCapturedOptions()).toEqual(
      expect.objectContaining({
        toolConcurrency: true,
        toolExecution: ToolExecutionMode.DRY_RUN
      })
    );
  });

  it("does not register onToolCallError/onConfirmToolCall on the core chat when no hooks are set", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    await chat.ask("Hello");

    const mockChat = mockLLM.chat.mock.results[0].value;
    expect(mockChat.onToolCallError).not.toHaveBeenCalled();
    expect(mockChat.onConfirmToolCall).not.toHaveBeenCalled();
  });

  it("wires onToolCallError so the first directive returned wins across all handlers", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    const calls: string[] = [];

    chat.onToolCallError(() => {
      calls.push("first");
      return "RETRY";
    });
    chat.onToolCallError(() => {
      calls.push("second");
      return "STOP";
    });

    await chat.ask("Hello");

    const directive = await mockLLM.getErrorHandler()({ id: "call_1" }, new Error("boom"));
    expect(calls).toEqual(["first", "second"]);
    expect(directive).toBe("RETRY");
  });

  it("wires onConfirmToolCall so every handler must approve", async () => {
    const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4o-mini" });
    const calls: string[] = [];

    chat.onConfirmToolCall(() => {
      calls.push("approver");
      return true;
    });
    chat.onConfirmToolCall(() => {
      calls.push("vetoer");
      return false;
    });

    await chat.ask("Hello");

    const approved = await mockLLM.getConfirmHandler()({ id: "call_1" });
    expect(calls).toEqual(["approver", "vetoer"]);
    expect(approved).toBe(false);
  });
});
