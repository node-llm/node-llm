import { describe, it, expect, vi, beforeEach } from "vitest";
import { HRAgentSession } from "@/models/hr-agent-session";
import { HRPolicyAgent } from "@/agents/hr-policy-agent";

// --- MOCK INFRASTRUCTURE ---
vi.mock("@/lib/db", () => {
  const store = {
    assistantAgentSession: new Map<string, any>(),
    assistantChat: new Map<string, any>(),
    assistantMessage: new Map<string, any>(),
    assistantToolCall: new Map<string, any>(),
    assistantRequest: new Map<string, any>(),
  };

  const createMock = (modelName: keyof typeof store) => ({
    create: vi.fn(async ({ data }: { data: any }) => {
      const id = data.id || `${modelName}_${Math.random().toString(36).substr(2)}`;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      store[modelName].set(id, record);
      return record;
    }),
    findUnique: vi.fn(async ({ where }: { where: any }) => {
      if (where.id) return store[modelName].get(where.id);
      // Handle chatId lookup for agentSession
      if (where.chatId) {
        for (const record of store[modelName].values()) {
          if (record.chatId === where.chatId) return record;
        }
      }
      return null;
    }),
    findMany: vi.fn(async () => [...store[modelName].values()]),
    update: vi.fn(async ({ where, data }: { where: any; data: any }) => {
      const record = store[modelName].get(where.id);
      if (record) {
        const updated = { ...record, ...data, updatedAt: new Date() };
        store[modelName].set(where.id, updated);
        return updated;
      }
      return null;
    }),
    count: vi.fn(async () => store[modelName].size),
    deleteMany: vi.fn(async () => {
      const count = store[modelName].size;
      store[modelName].clear();
      return { count };
    }),
  });

  return {
    prisma: {
      assistantAgentSession: createMock("assistantAgentSession"),
      assistantChat: createMock("assistantChat"),
      assistantMessage: createMock("assistantMessage"),
      assistantToolCall: createMock("assistantToolCall"),
      assistantRequest: createMock("assistantRequest"),
      $executeRawUnsafe: vi.fn(),
      $queryRawUnsafe: vi.fn(async () => []),
    },
  };
});

// --- MOCK LLM ---
vi.mock("@/lib/node-llm", () => {
  const mockChat = {
    ask: vi.fn(async () => ({
      id: "msg_123",
      role: "assistant",
      content: "Based on our HR policies, employees are entitled to 15 days of annual leave.",
      usage: { inputTokens: 50, outputTokens: 100 },
    })),
    stream: vi.fn(async function* () {
      yield { type: "text", content: "Based on " };
      yield { type: "text", content: "our HR policies..." };
      yield { type: "done", content: "Based on our HR policies..." };
    }),
    withTools: vi.fn().mockReturnThis(),
    withInstructions: vi.fn().mockReturnThis(),
    withMiddleware: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    messages: [],
  };

  return {
    llm: {
      chat: vi.fn(() => mockChat),
      withProvider: vi.fn().mockReturnThis(),
    },
  };
});

// --- MOCK DOCUMENT SEARCH ---
vi.mock("@/services/document-search", () => ({
  DocumentSearch: {
    search: vi.fn(async () => [
      {
        content: "Annual leave policy: All employees are entitled to 15 days of paid leave.",
        score: 0.95,
        metadata: { source: "leave-policy.md" },
      },
    ]),
  },
}));

describe("HRAgentSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new agent session", async () => {
      const session = await HRAgentSession.create({
        metadata: { userId: "user_123" },
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.chatId).toBeDefined();
    });

    it("should store metadata on creation", async () => {
      const session = await HRAgentSession.create({
        metadata: { userId: "user_456", source: "mobile-app" },
      });

      expect(session.metadata).toEqual({
        userId: "user_456",
        source: "mobile-app",
      });
    });
  });

  describe("load", () => {
    it("should load an existing session by ID", async () => {
      // Create a session first
      const created = await HRAgentSession.create({
        metadata: { test: true },
      });

      // Load it
      const loaded = await HRAgentSession.load(created.id);

      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(created.id);
    });

    it("should return null for non-existent session", async () => {
      const loaded = await HRAgentSession.load("non-existent-id");
      expect(loaded).toBeNull();
    });
  });

  describe("ask", () => {
    it("should send a message and get a response", async () => {
      const session = await HRAgentSession.create();
      const response = await session.ask("What is the leave policy?");

      expect(response).toBeDefined();
      expect(response.content).toContain("HR policies");
    });

    it("should use tools defined in HRPolicyAgent", async () => {
      // Verify HRPolicyAgent has the tool
      expect(HRPolicyAgent.tools).toBeDefined();
      expect(HRPolicyAgent.tools?.length).toBeGreaterThan(0);
    });
  });
});

describe("HRPolicyAgent", () => {
  it("should have static model defined", () => {
    expect(HRPolicyAgent.model).toBeDefined();
    expect(typeof HRPolicyAgent.model).toBe("string");
  });

  it("should have static instructions defined", () => {
    expect(HRPolicyAgent.instructions).toBeDefined();
    expect(HRPolicyAgent.instructions).toContain("HR");
  });

  it("should have SearchHRDocumentsTool in tools array", () => {
    expect(HRPolicyAgent.tools).toBeDefined();
    expect(HRPolicyAgent.tools?.length).toBe(1);
  });

  it("should have maxToolCalls configured", () => {
    expect(HRPolicyAgent.maxToolCalls).toBe(10);
  });

  it("should have temperature set to 0 for consistency", () => {
    expect(HRPolicyAgent.temperature).toBe(0);
  });
});
