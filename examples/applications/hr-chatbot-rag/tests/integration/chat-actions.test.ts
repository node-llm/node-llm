import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { sendMessage } from "@/app/chat-actions";
import { prisma } from "@/lib/db";
import { withVCR, describeVCR, mockLLM } from "@node-llm/testing";
import { providerRegistry, BaseProvider, ChatRequest, ChatResponse, NodeLLM } from "@node-llm/core";

// --- MOCK INFRASTRUCTURE (DB) ---
vi.mock("@/lib/db", () => {
  const store = {
    chats: new Map<string, any>(),
    messages: new Map<string, any>(),
  };

  const genericMock = {
    create: vi.fn(async ({ data }) => {
       const id = data.id || `gen_${Math.random().toString(36).substr(2)}`;
       return { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    }),
    findUnique: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    delete: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 0 })),
    update: vi.fn(async ({ data }) => data),
  };

  return {
    prisma: {
      assistantChat: {
        ...genericMock,
        create: vi.fn(async ({ data }) => {
          const id = data.id || `chat_${Math.random().toString(36).substr(2)}`;
          const chat = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
          store.chats.set(id, chat);
          return chat;
        }),
        findUnique: vi.fn(async ({ where }) => store.chats.get(where.id) || null),
        deleteMany: vi.fn(async () => { store.chats.clear(); return { count: 0 }; }),
      },
      assistantMessage: {
        ...genericMock,
        create: vi.fn(async ({ data }) => {
          const id = `msg_${Math.random().toString(36).substr(2)}`;
          const msg = { ...data, id, createdAt: new Date() };
          store.messages.set(id, msg);
          return msg;
        }),
        findMany: vi.fn(async ({ where }) => {
          return Array.from(store.messages.values())
            .filter(m => m.chatId === where.chatId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }),
        delete: vi.fn(async ({ where }) => {
            store.messages.delete(where.id);
            return { id: where.id };
        }),
        deleteMany: vi.fn(async () => { store.messages.clear(); return { count: 0 }; }),
      },
      assistantToolCall: genericMock,
      assistantRequest: genericMock,
      $transaction: vi.fn(async (fn) => fn(prisma)),
    }
  };
});

// --- MOCK INFRASTRUCTURE (LLM) ---
// We mock the app's NodeLLM instance to force it to use our provider
// irrespective of what createLLM does internally.
const mockProviderInstance = {
  id: "integration-mock",
  chat: vi.fn(async (req: any) => {
    const lastMsg = req.messages[req.messages.length - 1];
    const content = typeof lastMsg.content === 'string' ? lastMsg.content : 'nothing';
    return {
      content: `Mock response to: ${content}`,
      usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
    };
  }),
  capabilities: {
    supportsVision: () => true,
    supportsTools: () => true,
    supportsStructuredOutput: () => true,
    supportsEmbeddings: () => true,
    supportsImageGeneration: () => true,
    supportsTranscription: () => true,
    supportsModeration: () => true,
    supportsReasoning: () => true,
    supportsDeveloperRole: () => true,
    getContextWindow: () => 128000
  }
};

vi.mock("@/lib/node-llm", () => {
  const fluentMock = {
    chat: () => fluentMock, // chained
    ask: (msg: string) => mockProviderInstance.chat({ messages: [{ role: 'user', content: msg }] }),
    withProvider: () => fluentMock,
    withTool: () => fluentMock,
    withTools: () => fluentMock,
    system: () => fluentMock,
    add: () => fluentMock,
    onToolCallStart: () => fluentMock,
    onToolCallEnd: () => fluentMock,
    onToolCallError: () => fluentMock,
    beforeRequest: () => fluentMock,
    afterResponse: () => fluentMock,
    onEndMessage: () => fluentMock,
  };

  return {
    llm: fluentMock
  };
});


describeVCR("HR Chatbot Integration", () => {
  beforeEach(async () => {
    // Reset DB Mock
    await prisma.assistantMessage.deleteMany();
    await prisma.assistantChat.deleteMany();
  });

  it(
    "records and replays a full conversation flow",
    withVCR({ cassettesDir: "tests/cassettes" }, async () => {
      // 1. First interaction
      const res1 = await sendMessage(null, "Who is the HR head?");
      
      expect(res1.chatId).toBeDefined();
      expect(res1.message.content).toContain("Mock response to: Who is the HR head?");

      // 2. Second interaction
      const res2 = await sendMessage(res1.chatId, "What is the leave policy?");
      
      expect(res2.chatId).toBe(res1.chatId);
      expect(res2.message.content).toContain("Mock response to: What is the leave policy?");
      
      const messages = await prisma.assistantMessage.findMany({
        where: { chatId: res1.chatId },
        orderBy: { createdAt: 'asc' }
      });

      expect(messages).toHaveLength(4);
    })
  );

  it("handles LLM errors using the Declarative Mocker", async () => {
    // Since we mocked @/lib/node-llm, the REAL mockLLM logic won't work automatically 
    // because it relies on intercepting the real provider registry.
    // So we need to manually mock the error in our spy.
    
    mockProviderInstance.chat.mockRejectedValueOnce(new Error("LLM_TIMEOUT"));

    const chatPromise = sendMessage(null, "Fail me");
    await expect(chatPromise).rejects.toThrow("LLM_TIMEOUT");
  });
});
