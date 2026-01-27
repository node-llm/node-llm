/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChat, loadChat } from "../src/adapters/prisma/Chat.js";

// Mock Prisma Client
const createMockPrisma = () => {
  const messages: any[] = [];
  const chats: any[] = [];
  const toolCalls: any[] = [];
  const requests: any[] = [];

  const tables: any = {
    chat: {
      create: vi.fn(async ({ data }) => {
        const chat = { id: "chat-123", ...data, createdAt: new Date(), updatedAt: new Date() };
        chats.push(chat);
        return chat;
      }),
      findUnique: vi.fn(async ({ where }) => {
        return chats.find((c) => c.id === where.id) || null;
      })
    },
    message: {
      create: vi.fn(async ({ data }) => {
        const message = { id: `msg-${messages.length}`, ...data, createdAt: new Date() };
        messages.push(message);
        return message;
      }),
      findMany: vi.fn(async ({ where, orderBy: _orderBy }) => {
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
      delete: vi.fn(async ({ where }) => {
        const index = messages.findIndex((m) => m.id === where.id);
        if (index !== -1) {
          messages.splice(index, 1);
        }
      })
    },
    toolCall: {
      create: vi.fn(async ({ data }) => {
        const toolCall = { id: `tool-${toolCalls.length}`, ...data, createdAt: new Date() };
        toolCalls.push(toolCall);
        return toolCall;
      }),
      update: vi.fn(async ({ where, data }) => {
        const toolCall = toolCalls.find(
          (tc) =>
            tc.messageId === where.messageId_toolCallId.messageId &&
            tc.toolCallId === where.messageId_toolCallId.toolCallId
        );
        if (toolCall) {
          Object.assign(toolCall, data);
        }
        return toolCall;
      })
    },
    request: {
      create: vi.fn(async ({ data }) => {
        const request = { id: `req-${requests.length}`, ...data, createdAt: new Date() };
        requests.push(request);
        return request;
      }),
      aggregate: vi.fn(async ({ where }) => {
        const filtered = requests.filter((r) => r.chatId === where.chatId);
        return {
          _sum: {
            inputTokens: filtered.reduce((acc, r) => acc + (r.inputTokens || 0), 0),
            outputTokens: filtered.reduce((acc, r) => acc + (r.outputTokens || 0), 0),
            cost: filtered.reduce((acc, r) => acc + (r.cost || 0), 0)
          }
        };
      })
    },
    _messages: messages,
    _chats: chats,
    _toolCalls: toolCalls,
    _requests: requests
  };

  // Use Proxy to support any custom table name by mapping it to the base table mocks
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

// Mock NodeLLM
const createMockLLM = () => {
  let capturedAfterResponseCallback: any = null;
  let capturedToolCallStartCallback: any = null;
  let capturedToolCallEndCallback: any = null;
  let nextResponse: any = null;

  const mockChat: any = {
    system: vi.fn(() => mockChat),
    withTools: vi.fn(() => mockChat),
    onToolCallStart: vi.fn((cb) => {
      capturedToolCallStartCallback = cb;
      return mockChat;
    }),
    onToolCallEnd: vi.fn((cb) => {
      capturedToolCallEndCallback = cb;
      return mockChat;
    }),
    afterResponse: vi.fn((cb) => {
      capturedAfterResponseCallback = cb;
      return mockChat;
    }),
    onNewMessage: vi.fn(() => mockChat),
    onEndMessage: vi.fn(() => mockChat),
    beforeRequest: vi.fn(() => mockChat),
    ask: vi.fn(async () => {
      const toolCall = {
        id: "call-123",
        thought: "I need to search for this",
        function: { name: "search", arguments: '{"query":"test"}' }
      };

      // Simulate tool call lifecycle
      if (capturedToolCallStartCallback) {
        await capturedToolCallStartCallback(toolCall);
      }
      if (capturedToolCallEndCallback) {
        await capturedToolCallEndCallback(toolCall, "Search results");
      }

      // Simulate response
      const response = nextResponse || {
        content: "Hello from LLM!",
        meta: { model: "gpt-4", provider: "openai" },
        reasoning: null,
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.001 },
        model: "gpt-4",
        provider: "openai"
      };

      if (capturedAfterResponseCallback) {
        await capturedAfterResponseCallback({
          provider: response.provider || "openai",
          model: response.model || "gpt-4",
          latency: 100,
          usage: response.usage || { input_tokens: 10, output_tokens: 5, cost: 0.001 }
        });
      }

      return response;
    }),
    stream: vi.fn(async function* () {
      const toolCall = {
        id: "call-456",
        function: { name: "search", arguments: '{"query":"stream"}' }
      };

      // Simulate tool call during streaming
      if (capturedToolCallStartCallback) {
        await capturedToolCallStartCallback(toolCall);
      }
      if (capturedToolCallEndCallback) {
        await capturedToolCallEndCallback(toolCall, "Stream results");
      }

      // Yield tokens
      const tokens = ["Hello", " from", " streaming", "!"];
      for (const token of tokens) {
        yield { content: token, meta: null };
      }

      // Final chunk with metadata
      const finalMeta = {
        model: "gpt-4",
        provider: "openai",
        inputTokens: 15,
        outputTokens: 8,
        reasoning: null
      };

      if (capturedAfterResponseCallback) {
        await capturedAfterResponseCallback({
          provider: "openai",
          model: "gpt-4",
          latency: 200,
          usage: { input_tokens: 15, output_tokens: 8, cost: 0.002 }
        });
      }

      yield {
        content: "",
        meta: finalMeta,
        usage: { input_tokens: 15, output_tokens: 8, total_tokens: 23 }
      };
    })
  };

  const llm: any = {
    chat: vi.fn(() => mockChat),
    withProvider: vi.fn(() => llm),
    withResponse: (resp: any) => {
      nextResponse = resp;
    }
  };

  return llm;
};

describe("Chat ORM", () => {
  let mockPrisma: any;
  let mockLLM: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockLLM = createMockLLM();
  });

  describe("createChat", () => {
    it("should create a new chat session", async () => {
      const chat = await createChat(mockPrisma, mockLLM, {
        model: "gpt-4",
        provider: "openai",
        instructions: "You are helpful"
      });

      expect(chat.id).toBe("chat-123");
      expect(mockPrisma.chat.create).toHaveBeenCalledWith({
        data: {
          model: "gpt-4",
          provider: "openai",
          instructions: "You are helpful",
          metadata: null
        }
      });
    });

    it("should pass metadata as-is (native JSON support)", async () => {
      await createChat(mockPrisma, mockLLM, {
        metadata: { userId: "user-123" }
      });

      expect(mockPrisma.chat.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { userId: "user-123" }
        })
      });
    });

    it("should spread extra custom fields into create data", async () => {
      await createChat(mockPrisma, mockLLM, {
        model: "gpt-4",
        userId: "user-789",
        projectId: "proj-abc"
      } as any);

      expect(mockPrisma.chat.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          model: "gpt-4",
          userId: "user-789",
          projectId: "proj-abc"
        })
      });
    });
  });

  describe("loadChat", () => {
    it("should load an existing chat", async () => {
      await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      const loaded = await loadChat(mockPrisma, mockLLM, "chat-123");

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("chat-123");
    });

    it("should return null for non-existent chat", async () => {
      const loaded = await loadChat(mockPrisma, mockLLM, "nonexistent");
      expect(loaded).toBeNull();
    });
  });

  describe("ask", () => {
    it("should persist user and assistant messages", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      await chat.ask("Hello!");

      expect(mockPrisma.message.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma._messages).toHaveLength(2);
      expect(mockPrisma._messages[0].role).toBe("user");
      expect(mockPrisma._messages[0].content).toBe("Hello!");
      expect(mockPrisma._messages[1].role).toBe("assistant");
    });

    it("should update assistant message with LLM response", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      const response = await chat.ask("Hello!");

      expect(response.content).toBe("Hello from LLM!");
      expect(response.inputTokens).toBe(10);
      expect(response.outputTokens).toBe(5);
      expect(mockPrisma.message.update).toHaveBeenCalled();
    });

    it("should persist tool calls", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      await chat.ask("Search for something");

      expect(mockPrisma.toolCall.create).toHaveBeenCalled();
      expect(mockPrisma.toolCall.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result: "Search results"
          })
        })
      );
    });

    it("should persist API request metrics", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      await chat.ask("Hello!");

      expect(mockPrisma.request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "openai",
          model: "gpt-4",
          inputTokens: 10,
          outputTokens: 5,
          cost: 0.001
        })
      });
    });

    it("should cleanup on failure", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });

      // Force an error
      mockLLM.chat().ask.mockRejectedValueOnce(new Error("API Error"));

      await expect(chat.ask("Hello!")).rejects.toThrow("API Error");
      expect(mockPrisma.message.delete).toHaveBeenCalled();
    });
  });

  describe("askStream", () => {
    it("should yield tokens in real-time", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      const tokens: string[] = [];

      for await (const chunk of chat.askStream("Tell me a story")) {
        // Stream yields objects with { content, meta } - extract content
        const content = typeof chunk === "string" ? chunk : chunk.content;
        if (content) tokens.push(content);
      }

      expect(tokens).toEqual(["Hello", " from", " streaming", "!"]);
    });

    it("should persist complete message after streaming", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      const tokens: string[] = [];

      for await (const chunk of chat.askStream("Tell me a story")) {
        const content = typeof chunk === "string" ? chunk : chunk.content;
        if (content) tokens.push(content);
      }

      const messages = mockPrisma._messages.filter((m: any) => m.role === "assistant");
      expect(messages[0].content).toBe("Hello from streaming!");
      expect(messages[0].inputTokens).toBe(15);
      expect(messages[0].outputTokens).toBe(8);
    });

    it("should persist tool calls during streaming", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });

      for await (const _ of chat.askStream("Search")) {
        // consume stream
      }

      expect(mockPrisma.toolCall.create).toHaveBeenCalled();
      expect(mockPrisma.toolCall.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result: "Stream results"
          })
        })
      );
    });

    it("should cleanup on streaming failure", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });

      // Force streaming error
      mockLLM.chat().stream.mockImplementation(async function* () {
        yield { content: "", meta: null }; // Need at least one yield for generator
        throw new Error("Stream Error");
      });

      await expect(async () => {
        for await (const _ of chat.askStream("Hello!")) {
          // consume stream
        }
      }).rejects.toThrow("Stream Error");

      expect(mockPrisma.message.delete).toHaveBeenCalled();
    });
  });

  describe("messages", () => {
    it("should retrieve all messages for a chat", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });
      await chat.ask("First message");
      await chat.ask("Second message");

      const messages = await chat.messages();
      expect(messages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
    });
  });

  describe("Custom Table Names", () => {
    it("should use custom table names when creating chat", async () => {
      const tableNames = {
        chat: "llmChat",
        message: "llmMessage",
        toolCall: "llmToolCall",
        request: "llmRequest"
      };

      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4", tableNames });

      expect(mockPrisma.llmChat.create).toHaveBeenCalled();
      expect(chat.id).toBe("chat-123");
    });

    it("should use custom table names when loading chat", async () => {
      const tableNames = {
        chat: "llmChat"
      };

      // First create with custom names
      await createChat(mockPrisma, mockLLM, { model: "gpt-4", tableNames });

      // Then load with same custom names
      const loaded = await loadChat(mockPrisma, mockLLM, "chat-123", { tableNames });

      expect(mockPrisma.llmChat.findUnique).toHaveBeenCalled();
      expect(loaded?.id).toBe("chat-123");
    });

    it("should use custom table names for messages", async () => {
      const tableNames = {
        message: "llmMessage"
      };

      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4", tableNames });
      await chat.ask("Hello!");

      expect(mockPrisma.llmMessage.create).toHaveBeenCalled();
      expect(mockPrisma.llmMessage.update).toHaveBeenCalled();
    });

    it("should use custom table names for tool calls", async () => {
      const tableNames = {
        toolCall: "llmToolCall"
      };

      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4", tableNames });
      await chat.ask("Search");

      expect(mockPrisma.llmToolCall.create).toHaveBeenCalled();
    });

    it("should use custom table names for requests", async () => {
      const tableNames = {
        request: "llmRequest"
      };

      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4", tableNames });
      await chat.ask("Hello!");

      expect(mockPrisma.llmRequest.create).toHaveBeenCalled();
    });
  });

  describe("Persistence Configuration", () => {
    it("should skip tool call persistence when disabled", async () => {
      const chat = await createChat(mockPrisma, mockLLM, {
        model: "gpt-4",
        persistence: { toolCalls: false }
      });

      await chat.ask("Search for something");

      // Tool calls should NOT be persisted
      expect(mockPrisma.toolCall.create).not.toHaveBeenCalled();
      expect(mockPrisma.toolCall.update).not.toHaveBeenCalled();

      // But requests should still be persisted (default: true)
      expect(mockPrisma.request.create).toHaveBeenCalled();
    });

    it("should skip request persistence when disabled", async () => {
      const chat = await createChat(mockPrisma, mockLLM, {
        model: "gpt-4",
        persistence: { requests: false }
      });

      await chat.ask("Hello!");

      // Requests should NOT be persisted
      expect(mockPrisma.request.create).not.toHaveBeenCalled();

      // But tool calls should still be persisted (default: true)
      expect(mockPrisma.toolCall.create).toHaveBeenCalled();
    });

    it("should disable both toolCalls and requests when configured", async () => {
      const chat = await createChat(mockPrisma, mockLLM, {
        model: "gpt-4",
        persistence: {
          toolCalls: false,
          requests: false
        }
      });

      await chat.ask("Search");

      expect(mockPrisma.toolCall.create).not.toHaveBeenCalled();
      expect(mockPrisma.request.create).not.toHaveBeenCalled();

      // Messages should still be persisted (always required)
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it("should persist everything by default when persistence config is omitted", async () => {
      const chat = await createChat(mockPrisma, mockLLM, { model: "gpt-4" });

      await chat.ask("Search");

      // All persistence should be enabled by default
      expect(mockPrisma.toolCall.create).toHaveBeenCalled();
      expect(mockPrisma.request.create).toHaveBeenCalled();
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });
  });

  describe("stats", () => {
    it("aggregates usage and cost across multiple turns", async () => {
      const mockPrisma = createMockPrisma();
      const mockLLM = createMockLLM();
      const chat = await createChat(mockPrisma as any, mockLLM as any);

      // Turn 1
      mockLLM.withResponse({
        content: "Turn 1",
        usage: { input_tokens: 10, output_tokens: 20, cost: 0.05 }
      });
      await chat.ask("Hello 1");

      // Turn 2
      mockLLM.withResponse({
        content: "Turn 2",
        usage: { input_tokens: 30, output_tokens: 40, cost: 0.15 }
      });
      await chat.ask("Hello 2");

      const stats = await chat.stats();
      expect(stats.input_tokens).toBe(40);
      expect(stats.output_tokens).toBe(60);
      expect(stats.total_tokens).toBe(100);
      expect(stats.cost).toBe(0.2);
    });
  });
});
