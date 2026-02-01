import { describe, it, expect, beforeEach, vi } from "vitest";
import { createChat } from "../src/adapters/prisma/index.js";

// Helper to define what keys are ALLOWED in our Prisma schema
// This mirrors AssistantChat in prisma/schema.prisma
const ALLOWED_SCHEMA_KEYS = [
  "id",
  "model",
  "provider",
  "instructions",
  "metadata",
  "createdAt",
  "updatedAt"
];

const createStrictMockPrisma = () => {
  const tables: any = {
    chat: {
      create: vi.fn(async ({ data }) => {
        // STRICTNESS CHECK: Catch the leak that happened in production
        const keys = Object.keys(data);
        const forbiddenKeys = keys.filter((k) => !ALLOWED_SCHEMA_KEYS.includes(k));

        if (forbiddenKeys.length > 0) {
          throw new Error(
            `PrismaClientValidationError: Unknown argument(s) [${forbiddenKeys.join(", ")}]. Available options are marked with ?.`
          );
        }

        return { id: "chat-123", ...data, createdAt: new Date(), updatedAt: new Date() };
      })
    },
    message: {
      create: vi.fn(async ({ data }) => ({ id: "msg-1", ...data, createdAt: new Date() })),
      findMany: vi.fn(async () => [])
    },
    toolCall: { create: vi.fn() },
    request: { create: vi.fn() }
  };

  return new Proxy(tables, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === "string") {
        if (prop.toLowerCase().includes("chat")) return target.chat;
        if (prop.toLowerCase().includes("message")) return target.message;
      }
      return undefined;
    }
  });
};

describe("ORM Persistence Strictness", () => {
  let mockPrisma: any;
  const mockLLM: any = {
    chat: vi.fn(() => ({
      ask: vi.fn(async () => ({ content: "hi", meta: {}, usage: {} }))
    })),
    withProvider: vi.fn(() => mockLLM)
  };

  beforeEach(() => {
    mockPrisma = createStrictMockPrisma();
  });

  it("should strip runtime-only options before calling prisma.create", async () => {
    // We pass "dirty" data that contains NodeLLM runtime options
    // These should work for the LLM but should BE STRIPPED before entering the DB
    const dirtyOptions: any = {
      model: "gpt-4o",
      provider: "openai",
      instructions: "Be helpful",
      middlewares: [{ name: "Test", onRequest: () => {} }],
      maxToolCalls: 10,
      temperature: 0.7,
      maxTokens: 500,
      thinking: { budget: 1000 },
      headers: { "X-Test": "Value" },
      requestTimeout: 30000,
      params: { custom: "param" }
    };

    // This should NOT throw if the ORM correctly filters the data
    await expect(createChat(mockPrisma, mockLLM, dirtyOptions)).resolves.toBeDefined();

    // Verify exactly what was sent to Prisma
    const callArgs = mockPrisma.chat.create.mock.calls[0][0];
    const sentData = callArgs.data;

    // Must have
    expect(sentData).toHaveProperty("model", "gpt-4o");
    expect(sentData).toHaveProperty("instructions", "Be helpful");

    // Must NOT have (these are runtime-only)
    expect(sentData).not.toHaveProperty("middlewares");
    expect(sentData).not.toHaveProperty("maxToolCalls");
    expect(sentData).not.toHaveProperty("temperature");
    expect(sentData).not.toHaveProperty("thinking");
    expect(sentData).not.toHaveProperty("headers");
    expect(sentData).not.toHaveProperty("params");

    // Check that we didn't leave any leaked keys
    const finalKeys = Object.keys(sentData);
    finalKeys.forEach((key) => {
      expect(ALLOWED_SCHEMA_KEYS).toContain(key);
    });
  });

  it("should fail if the mock strictness is triggered (sanity check)", async () => {
    // This test ensures our mock is actually working as a validator
    const invalidData = { someRandomKey: "should break" };

    await expect(mockPrisma.chat.create({ data: invalidData })).rejects.toThrow(
      "PrismaClientValidationError"
    );
  });
});
