import { describe, it, expect, vi } from "vitest";
import { NodeLLM, createLLM } from "../../../src/index.js";
import { SchemaSelfCorrectionMiddleware } from "../../../src/middlewares/SchemaSelfCorrection.js";
import { Provider, ChatResponse } from "../../../src/providers/Provider.js";
import { z } from "zod";

describe("SchemaSelfCorrectionMiddleware", () => {
  it("should retry when validation fails and succeed on second attempt", async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    // Mock Provider that fails first time then succeeds
    let callCount = 0;
    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Bad response: age is a string
          return {
            content: JSON.stringify({ name: "John", age: "30" }),
            usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
          } as ChatResponse;
        }
        // Good response
        return {
          content: JSON.stringify({ name: "John", age: 30 }),
          usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
        } as ChatResponse;
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });

    // Enable self-correction
    const chat = llm.chat("mock-model", {
      schema: { definition: { name: "User", schema } },
      middlewares: [new SchemaSelfCorrectionMiddleware({ maxRetries: 2 })]
    });

    const response = await chat.ask("Get user info");

    expect(callCount).toBe(2);
    expect(response.data).toEqual({ name: "John", age: 30 });
    expect(chat.history).toHaveLength(4); // User -> Assistant (Bad) -> User (Feedback) -> Assistant (Good)
  });

  it("should stop after max retries", async () => {
    const schema = z.object({ age: z.number() });

    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({ age: "still-a-string" }),
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });

    const chat = llm.chat("mock-model", {
      schema: { definition: { name: "User", schema } },
      middlewares: [new SchemaSelfCorrectionMiddleware({ maxRetries: 1 })]
    });

    const response = await chat.ask("Get age");

    // Should have called twice (initial + 1 retry)
    expect(mockProvider.chat).toHaveBeenCalledTimes(2);

    // Final response should still be invalid
    expect(response.isValid).toBe(false);
    expect(() => response.data).toThrow();
  });

  it("should not retry if no schema is provided", async () => {
    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockResolvedValue({
        content: "not-json",
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });
    const chat = llm.chat("mock-model", {
      middlewares: [new SchemaSelfCorrectionMiddleware({ maxRetries: 2 })]
    });

    await chat.ask("Hello");

    expect(mockProvider.chat).toHaveBeenCalledTimes(1);
  });

  it("should succeed after two retries if maxRetries is 2", async () => {
    const schema = z.object({ value: z.number() });
    let attempts = 0;

    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          return {
            content: JSON.stringify({ value: "bad" }),
            usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
          };
        }
        return {
          content: JSON.stringify({ value: 42 }),
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
        };
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });
    const chat = llm.chat("mock-model", {
      schema: { definition: { name: "Test", schema } },
      middlewares: [new SchemaSelfCorrectionMiddleware({ maxRetries: 2 })]
    });

    const response = await chat.ask("Give me 42");
    expect(attempts).toBe(3); // Initial + 2 retries
    expect(response.data).toEqual({ value: 42 });
  });
});
