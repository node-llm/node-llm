import { describe, it, expect, vi, beforeEach } from "vitest";
import { Agent, Tool, NodeLLM } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession";

// --- Mocks ---

// Mock Prisma Client
const mockPrisma = {
  llmChat: {
    create: vi.fn(),
    findUnique: vi.fn()
  },
  llmAgentSession: {
    create: vi.fn(),
    findUnique: vi.fn()
  },
  llmMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

// Mock LLM
const mockLlm = {
  chat: vi.fn().mockReturnValue({
    withInstructions: vi.fn(),
    withTools: vi.fn(),
    withSchema: vi.fn(),
    ask: vi.fn().mockResolvedValue({
      content: "Response",
      meta: {},
      usage: { input_tokens: 10, output_tokens: 5 }
    }),
    stream: vi.fn(),
    history: [],
    totalUsage: { input_tokens: 0, output_tokens: 0 },
    modelId: "mock-model"
  })
} as unknown as typeof NodeLLM;

// --- Test Classes ---

class TestAgent extends Agent {
  static model = "gpt-4-test";
  static instructions = "Test instructions";
}

describe("AgentSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAgentSession", () => {
    it("creates a new session with correct metadata", async () => {
      // Setup mocks
      mockPrisma.llmChat.create.mockResolvedValue({ id: "chat-123" });
      mockPrisma.llmAgentSession.create.mockResolvedValue({
        id: "session-123",
        chatId: "chat-123",
        agentClass: "TestAgent",
        metadata: { userId: "user-1" }
      });

      const session = await createAgentSession(mockPrisma as any, mockLlm, TestAgent, {
        metadata: { userId: "user-1" }
      });

      // Verify DB calls
      expect(mockPrisma.llmChat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            model: "gpt-4-test",
            instructions: "Test instructions"
          })
        })
      );

      expect(mockPrisma.llmAgentSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentClass: "TestAgent",
            chatId: "chat-123",
            metadata: { userId: "user-1" }
          })
        })
      );

      // Verify Session Object
      expect(session.id).toBe("session-123");
      expect(session.metadata).toEqual({ userId: "user-1" });
      expect(session.agentClass).toBe("TestAgent");
    });
  });

  describe("loadAgentSession", () => {
    it("loads an existing session and injects history", async () => {
      // Setup Mocks
      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        id: "session-123",
        chatId: "chat-123",
        agentClass: "TestAgent",
        metadata: { userId: "user-1" }
      });

      mockPrisma.llmMessage.findMany.mockResolvedValue([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" }
      ]);

      const session = await loadAgentSession(mockPrisma as any, mockLlm, TestAgent, "session-123");

      expect(session).not.toBeNull();
      expect(session?.id).toBe("session-123");

      // Verify history injection (implicit via mock setup, would check agent internals in real integration)
      // Implementation detail: The Agent constructor is called with { messages: [...] }
      // We can verify this by checking if the agent property exists and works

      expect(mockPrisma.llmMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { chatId: "chat-123" },
          orderBy: { createdAt: "asc" }
        })
      );
    });

    it("throws error on agent class mismatch", async () => {
      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        id: "session-123",
        agentClass: "OtherAgent", // Mismatch
        chatId: "chat-123"
      });

      await expect(
        loadAgentSession(mockPrisma as any, mockLlm, TestAgent, "session-123")
      ).rejects.toThrow("Agent class mismatch");
    });
  });

  describe("ask", () => {
    it("persists user and assistant messages", async () => {
      // Setup Session
      const sessionRecord = {
        id: "session-123",
        chatId: "chat-123",
        agentClass: "TestAgent",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock AgentSession manually to test .ask()
      // But simpler to use createAgentSession mock return if we could,
      // here we instantiate directly or via factory.

      mockPrisma.llmChat.create.mockResolvedValue({ id: "chat-123" });
      mockPrisma.llmAgentSession.create.mockResolvedValue(sessionRecord);

      const session = await createAgentSession(mockPrisma as any, mockLlm, TestAgent);

      // Mock message creation
      mockPrisma.llmMessage.create
        .mockResolvedValueOnce({ id: "msg-user" }) // User message
        .mockResolvedValueOnce({ id: "msg-asst" }); // Assistant placeholder

      mockPrisma.llmMessage.update.mockResolvedValue({
        id: "msg-asst",
        content: "Response",
        role: "assistant"
      });

      await session.ask("Hello");

      // Verify persistence
      expect(mockPrisma.llmMessage.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.llmMessage.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({ role: "user", content: "Hello" })
        })
      );

      expect(mockPrisma.llmMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "msg-asst" },
          data: expect.objectContaining({ content: "Response" })
        })
      );
    });
  });
});
