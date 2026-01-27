import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssistantChat } from "@/models/assistant-chat";
import { prisma } from "@/lib/db";
import { llm } from "@/lib/node-llm";

// --- MOCK INFRASTRUCTURE (DB) ---
vi.mock("@/lib/db", () => {
    const store = {
        assistantChat: new Map<string, any>(),
        assistantMessage: new Map<string, any>(),
        assistantToolCall: new Map<string, any>(),
        assistantRequest: new Map<string, any>(),
    };

    const findRecord = (modelName: keyof typeof store, where: any) => {
        // Direct ID lookup
        if (where.id) return store[modelName].get(where.id);
        
        // Composite key lookup (e.g. messageId_toolCallId)
        // Prisma passes compound keys as the property name, e.g. where: { messageId_toolCallId: { messageId: '...', toolCallId: '...' } }
        // OR sometimes top level?
        
        // Let's just scan for any matching properties for simplicity in this mock
        for (const record of store[modelName].values()) {
            let match = true;
            for (const key of Object.keys(where)) {
                // If the key is a compound object (Prisma style), check inside
                if (typeof where[key] === 'object' && where[key] !== null && !Array.isArray(where[key])) {
                     for (const subtKey of Object.keys(where[key])) {
                         if (record[subtKey] !== where[key][subtKey]) {
                             match = false;
                             break;
                         }
                     }
                } else {
                     if (record[key] !== where[key]) {
                        match = false;
                        break;
                     }
                }
                if (!match) break;
            }
            if (match) return record;
        }
        return null;
    };

    const createMock = (modelName: keyof typeof store) => ({
        create: vi.fn(async ({ data }: { data: any }) => {
            const id = data.id || `${modelName}_${Math.random().toString(36).substr(2)}`;
            const record = { ...data, id, createdAt: new Date(), updatedAt: new Date(), metadata: data.metadata || {} };
            store[modelName].set(id, record);
            return record;
        }),
        update: vi.fn(async ({ where, data }: { where: any, data: any }) => {
            const current = findRecord(modelName, where);
            if (!current) {
                console.error(`[MockDB] Update failed. Record not found for where:`, JSON.stringify(where));
                throw new Error(`Record to update not found: ${JSON.stringify(where)}`);
            }
            const updated = { ...current, ...data, updatedAt: new Date() };
            // Ensure we update using the PRIMARY ID
            store[modelName].set(current.id, updated);
            return updated;
        }),
        findMany: vi.fn(async (args?: { where?: any, orderBy?: any }) => {
            let items = Array.from(store[modelName].values());
            if (args?.where) {
                Object.keys(args.where).forEach(key => {
                    items = items.filter(i => i[key] === args.where[key]);
                });
            }
            if (args?.orderBy) {
                if (args.orderBy.createdAt === 'asc') {
                    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }
            }
            return items;
        }),
        findUnique: vi.fn(async ({ where }: { where: any }) => findRecord(modelName, where)),
        delete: vi.fn(async ({ where }: { where: any }) => {
            const current = findRecord(modelName, where);
            if (!current) return null;
            store[modelName].delete(current.id);
            return { id: current.id };
        }),
        deleteMany: vi.fn(async () => {
             const count = store[modelName].size;
             store[modelName].clear();
             return { count };
        }),
        aggregate: vi.fn(async () => ({
            _sum: {
                inputTokens: 0,
                outputTokens: 0,
                cost: 0
            }
        })),
    });

    return {
        prisma: {
            assistantChat: createMock("assistantChat"),
            assistantMessage: createMock("assistantMessage"),
            assistantToolCall: createMock("assistantToolCall"),
            assistantRequest: createMock("assistantRequest"),
            $transaction: vi.fn(async (fn) => fn(prisma)),
        }
    };
});

// Mock NodeLLM logic is kept same as previous step...
vi.mock("@/lib/node-llm", () => ({
  llm: {
    chat: vi.fn(() => {
      const mockChat = {
        system: vi.fn(),
        add: vi.fn(),
        ask: vi.fn().mockResolvedValue({
          content: "I am an assistant",
          meta: { id: "msg_123" },
          inputTokens: 10,
          outputTokens: 20,
          model: "gpt-4o",
          provider: "openai",
        }),
        onToolCallStart: vi.fn().mockReturnThis(),
        onToolCallEnd: vi.fn().mockReturnThis(),
        onToolCallError: vi.fn().mockReturnThis(),
        beforeRequest: vi.fn().mockReturnThis(),
        afterResponse: vi.fn().mockReturnThis(),
        onEndMessage: vi.fn().mockReturnThis(),
      };
      mockChat.onToolCallStart.mockReturnValue(mockChat);
      mockChat.onToolCallEnd.mockReturnValue(mockChat);
      mockChat.onToolCallError.mockReturnValue(mockChat);
      mockChat.beforeRequest.mockReturnValue(mockChat);
      mockChat.afterResponse.mockReturnValue(mockChat);
      mockChat.onEndMessage.mockReturnValue(mockChat);
      return mockChat;
    }),
    withProvider: vi.fn().mockReturnThis(),
  },
}));

describe("AssistantChat Persistence", () => {
  beforeEach(async () => {
    await prisma.assistantMessage.deleteMany();
    await prisma.assistantChat.deleteMany();
    await prisma.assistantToolCall.deleteMany();
    await prisma.assistantRequest.deleteMany();
    vi.clearAllMocks();
  });

  // Tests kept same as previous step...
  it("should persist user and assistant messages on successful ask", async () => {
    const chat = await AssistantChat.create({
      instructions: "You are a helpful HR bot.",
      model: "gpt-4o",
    });

    const response = await chat.ask("What is our leave policy?");

    expect(response.content).toBe("I am an assistant");
    const messages = await chat.messages();
    expect(messages).toHaveLength(2);
  });

  it("should cleanup the empty assistant message if the API call fails", async () => {
    const mockChat = {
        system: vi.fn(),
        add: vi.fn(),
        ask: vi.fn().mockRejectedValue(new Error("API Timeout")),
        onToolCallStart: vi.fn().mockReturnThis(),
        onToolCallEnd: vi.fn().mockReturnThis(),
        onToolCallError: vi.fn().mockReturnThis(),
        beforeRequest: vi.fn().mockReturnThis(),
        afterResponse: vi.fn().mockReturnThis(),
        onEndMessage: vi.fn().mockReturnThis(),
    };
    mockChat.onToolCallStart.mockReturnValue(mockChat);
    mockChat.onToolCallEnd.mockReturnValue(mockChat);
    mockChat.onToolCallError.mockReturnValue(mockChat);
    mockChat.beforeRequest.mockReturnValue(mockChat);
    mockChat.afterResponse.mockReturnValue(mockChat);
    mockChat.onEndMessage.mockReturnValue(mockChat);
    
    vi.spyOn(llm, "chat").mockReturnValue(mockChat as any);

    const chat = await AssistantChat.create();
    await expect(chat.ask("Fail me")).rejects.toThrow("API Timeout");
    const messages = await chat.messages();
    expect(messages).toHaveLength(1);
    expect(messages.find(m => m.role === 'assistant')).toBeUndefined();
  });

  it("should persist tool execution details", async () => {
    let capturedToolStartCallback: Function | undefined;
    let capturedToolEndCallback: Function | undefined;
    let capturedAfterResponseCallback: Function | undefined;

    const mockChat = {
      system: vi.fn(),
      add: vi.fn(),
      onToolCallStart: vi.fn().mockImplementation((cb) => {
        capturedToolStartCallback = cb;
        return mockChat;
      }),
      onToolCallEnd: vi.fn().mockImplementation((cb) => {
        capturedToolEndCallback = cb;
        return mockChat;
      }),
      onToolCallError: vi.fn().mockReturnThis(),
      beforeRequest: vi.fn().mockReturnThis(),
      afterResponse: vi.fn().mockImplementation((cb) => {
         capturedAfterResponseCallback = cb;
         return mockChat;
      }),
      onEndMessage: vi.fn().mockReturnThis(),
      ask: vi.fn().mockImplementation(async () => {
        if (capturedToolStartCallback && capturedToolEndCallback) {
          const toolCall = { id: "call_123", function: { name: "search_hr", arguments: '{"query":"payout"}' } };
          await capturedToolStartCallback(toolCall);
          await capturedToolEndCallback(
            toolCall,
            "Tool Result Data"
          );
        }
        if (capturedAfterResponseCallback) {
            await capturedAfterResponseCallback({ provider: 'openai', model: 'gpt-4o', usage: { input_tokens: 10, output_tokens: 5, cost: 0, total_tokens: 15 } });
        }
        return {
          content: "Here is the payout info.",
          meta: { id: "msg_2" },
          inputTokens: 15,
          outputTokens: 10,
          model: "gpt-4o",
          provider: "openai",
          usage: { input_tokens: 15, output_tokens: 10 }
        };
      }),
    };

    vi.spyOn(llm, "chat").mockReturnValue(mockChat as any);

    const chat = await AssistantChat.create();
    await chat.ask("Check payout");

    const toolCalls = await prisma.assistantToolCall.findMany();
    // With scanner mock, findUnique should work if app uses composite keys
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].name).toBe("search_hr");

    const requests = await prisma.assistantRequest.findMany();
    expect(requests).toHaveLength(1);
  });

  it("should persist and retrieve JSON metadata correctly", async () => {
    const metadata = { source: "web-ui", tags: ["hr-policy", "test"] };
    const chat = await AssistantChat.create({ instructions: "You are helpful.", model: "gpt-4o", metadata });
    const chatRecord = await prisma.assistantChat.findUnique({ where: { id: chat.id } });
    expect(chatRecord).not.toBeNull();
    expect(chatRecord!.metadata).toEqual(expect.objectContaining(metadata));
  });
});
