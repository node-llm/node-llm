import { describe, it, expect, vi, beforeEach } from "vitest";
import { Agent, Tool, NodeLLM } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession.js";

// --- Mocks ---

// Mock Prisma Client
const mockPrisma = {
  llmChat: {
    create: vi.fn(),
    findUnique: vi.fn()
  },
  llmAgentSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn()
  },
  llmMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
};

// Mock LLM
const createMockChat = () => {
  const mockChat = {
    withInstructions: vi.fn().mockReturnThis(),
    withTools: vi.fn().mockReturnThis(),
    withSchema: vi.fn().mockReturnThis(),
    ask: vi.fn().mockResolvedValue({
      content: "Response",
      meta: {},
      usage: { input_tokens: 10, output_tokens: 5 }
    }),
    stream: vi.fn(),
    history: [],
    totalUsage: { input_tokens: 0, output_tokens: 0 },
    modelId: "mock-model",
    // Hook methods required by Agent constructor
    beforeRequest: vi.fn().mockReturnThis(),
    onToolCallStart: vi.fn().mockReturnThis(),
    onToolCallEnd: vi.fn().mockReturnThis(),
    onToolCallError: vi.fn().mockReturnThis(),
    onEndMessage: vi.fn().mockReturnThis()
  };
  return mockChat;
};

const mockLlm = {
  chat: vi.fn().mockImplementation(() => createMockChat())
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

  describe("Lazy Evaluation & Metadata", () => {
    interface TestInputs {
      userName: string;
    }

    class LazyTestAgent extends Agent<TestInputs> {
      static model = "gpt-4-lazy";
      static instructions = (i: TestInputs) => `Hello ${i.userName}`;
    }

    it("injects metadata as inputs for lazy resolution during load", async () => {
      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        id: "session-123",
        chatId: "chat-123",
        agentClass: "LazyTestAgent",
        metadata: { userName: "Alice" }
      });
      mockPrisma.llmMessage.findMany.mockResolvedValue([]);

      const session = await loadAgentSession(
        mockPrisma as any,
        mockLlm,
        LazyTestAgent as any,
        "session-123"
      );

      // Extract the underlying agent's chat instance
      const mockChat = (session as any).agent.chat;
      expect(mockChat.withInstructions).toHaveBeenCalledWith("Hello Alice", { replace: true });
    });

    it("merges turn-level inputs with session metadata during ask()", async () => {
      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        id: "session-123",
        chatId: "chat-123",
        agentClass: "LazyTestAgent",
        metadata: { userName: "Bob" }
      });
      mockPrisma.llmMessage.findMany.mockResolvedValue([]);
      mockPrisma.llmMessage.create.mockResolvedValue({ id: "msg" });
      mockPrisma.llmMessage.update.mockResolvedValue({ id: "msg" });

      const session = (await loadAgentSession(
        mockPrisma as any,
        mockLlm,
        LazyTestAgent as any,
        "session-123"
      ))!;

      // Mock the instructions resolver again to proof turn-level override
      LazyTestAgent.instructions = (i: any) => `Hi ${i.userName}, turn: ${i.turn}`;

      await session.ask("Hello", { inputs: { turn: "1" } } as any);

      const mockChat = (session as any).agent.chat;
      expect(mockChat.ask).toHaveBeenCalledWith(
        "Hello",
        expect.objectContaining({
          inputs: expect.objectContaining({
            userName: "Bob",
            turn: "1"
          })
        })
      );
    });
  });

  describe("Delegation & Metadata", () => {
    it("delegates withTool to the underlying agent", async () => {
      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        agentClass: "TestAgent",
        metadata: {}
      });
      mockPrisma.llmMessage.findMany.mockResolvedValue([]);

      const session = (await loadAgentSession(mockPrisma as any, mockLlm, TestAgent, "123"))!;
      session.withTool({ name: "extra-tool" });

      expect((session as any).agent.chat.withTools).toHaveBeenCalledWith(
        [{ name: "extra-tool" }],
        undefined
      );
    });

    it("updates metadata and re-resolves lazy config", async () => {
      class LazyAgent extends Agent<{ color: string }> {
        static model = "mock-model";
        static instructions = (i: any) => `Color is ${i.color}`;
      }

      mockPrisma.llmAgentSession.findUnique.mockResolvedValue({
        id: "123",
        agentClass: "LazyAgent",
        metadata: { color: "red" }
      });
      mockPrisma.llmMessage.findMany.mockResolvedValue([]);
      mockPrisma.llmAgentSession.update = vi.fn().mockResolvedValue({});

      const session = (await loadAgentSession(
        mockPrisma as any,
        mockLlm,
        LazyAgent as any,
        "123"
      ))!;

      // Initial resolution
      expect((session as any).agent.chat.withInstructions).toHaveBeenCalledWith("Color is red", {
        replace: true
      });

      await session.updateMetadata({ color: "blue" });

      // Verify DB update
      expect(mockPrisma.llmAgentSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { metadata: { color: "blue" } }
        })
      );

      // Verify re-resolution
      expect((session as any).agent.chat.withInstructions).toHaveBeenCalledWith("Color is blue", {
        replace: true
      });
    });
  });
});
