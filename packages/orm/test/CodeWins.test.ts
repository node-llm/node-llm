import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NodeLLMCore, Agent } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "../src/adapters/prisma/AgentSession.js";

// Mock Prisma
const mockChatTable = {
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn()
};

const mockSessionTable = {
  create: vi.fn(),
  findUnique: vi.fn()
};

const mockMessageTable = {
  create: vi.fn(),
  findMany: vi.fn(),
  delete: vi.fn(),
  update: vi.fn()
};

const prisma = {
  llmChat: mockChatTable,
  llmAgentSession: mockSessionTable,
  llmMessage: mockMessageTable
} as unknown as PrismaClient;

// Mock Agent & LLM
class TestAgent extends Agent {
  static override model = "agent-model";
  static override instructions = "agent-instructions";
}

const mockChat = {
  withInstructions: vi.fn().mockReturnThis(),
  withTools: vi.fn().mockReturnThis(),
  withSchema: vi.fn().mockReturnThis(),
  beforeRequest: vi.fn().mockReturnThis(),
  onToolCallStart: vi.fn().mockReturnThis(),
  onToolCallEnd: vi.fn().mockReturnThis(),
  onToolCallError: vi.fn().mockReturnThis(),
  onEndMessage: vi.fn().mockReturnThis(),
  ask: vi.fn(),
  messages: [],
  modelId: "agent-model"
};

const llm = {
  chat: vi.fn(() => mockChat)
} as unknown as NodeLLMCore;

describe("AgentSession - Code Wins Sovereignty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prioritize Agent class instructions over DB instructions when loading a session", async () => {
    const sessionId = "sess_123";
    const chatId = "chat_456";

    // 1. Mock DB returning DIFFERENT instructions than the class
    mockSessionTable.findUnique.mockResolvedValue({
      id: sessionId,
      chatId: chatId,
      agentClass: "TestAgent"
    });

    mockChatTable.findUnique.mockResolvedValue({
      id: chatId,
      model: "db-model", // DB says db-model
      instructions: "db-instructions" // DB says db-instructions
    });

    mockMessageTable.findMany.mockResolvedValue([]);

    // 2. Load the session
    const session = await loadAgentSession(prisma, llm, TestAgent, sessionId);

    expect(session).toBeDefined();

    // 3. Verify Agent was instantiated with the correct LLM and history (empty here)
    // The Agent constructor calls llm.chat(model, options)
    expect(llm.chat).toHaveBeenCalledWith("agent-model", expect.any(Object));

    // 4. Verify instructions applied to chat came from TestAgent.instructions
    expect(mockChat.withInstructions).toHaveBeenCalledWith("agent-instructions");
    expect(mockChat.withInstructions).not.toHaveBeenCalledWith("db-instructions");
  });

  it("should prioritize Agent class model over DB model when creating a session", async () => {
    mockChatTable.create.mockResolvedValue({ id: "chat_789" });
    mockSessionTable.create.mockResolvedValue({
      id: "sess_789",
      chatId: "chat_789",
      agentClass: "TestAgent"
    });

    // 1. Create a session
    await createAgentSession(prisma, llm, TestAgent);

    // 2. Verify chat record was created with Agent class properties
    expect(mockChatTable.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        model: "agent-model",
        instructions: "agent-instructions"
      })
    });

    // 3. Verify the live agent instance also uses these
    expect(llm.chat).toHaveBeenCalledWith("agent-model", expect.any(Object));
    expect(mockChat.withInstructions).toHaveBeenCalledWith("agent-instructions");
  });
});
