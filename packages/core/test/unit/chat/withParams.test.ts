import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";

describe("Chat.withParams", () => {
  const mockProvider: Provider = {
    chat: vi.fn(async (request: ChatRequest): Promise<ChatResponse> => {
      return {
        content: "Test response",
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 }
      };
    })
  };

  it("should merge custom params into the request", async () => {
    const chat = new Chat(mockProvider, "test-model");
    
    await chat
      .withParams({ seed: 42, user: "test-user" })
      .ask("Hello");

    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        seed: 42,
        user: "test-user"
      })
    );
  });

  it("should merge multiple withParams calls", async () => {
    const chat = new Chat(mockProvider, "test-model");
    
    await chat
      .withParams({ seed: 42 })
      .withParams({ user: "test-user", custom_field: "value" })
      .ask("Hello");

    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        seed: 42,
        user: "test-user",
        custom_field: "value"
      })
    );
  });

  it("should allow params to override standard parameters", async () => {
    const chat = new Chat(mockProvider, "test-model");
    
    await chat
      .withTemperature(0.5)
      .withParams({ temperature: 0.9 })
      .ask("Hello");

    // Params spread after standard params, so they can override
    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.9
      })
    );
  });

  it("should allow provider-specific nested parameters", async () => {
    const chat = new Chat(mockProvider, "test-model");
    
    await chat
      .withParams({ 
        generationConfig: { topP: 0.8, topK: 40 },
        safetySettings: [{ category: "TEST", threshold: "BLOCK_NONE" }]
      })
      .ask("Hello");

    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: { topP: 0.8, topK: 40 },
        safetySettings: [{ category: "TEST", threshold: "BLOCK_NONE" }]
      })
    );
  });

  it("should work with other fluent methods", async () => {
    const chat = new Chat(mockProvider, "test-model");
    
    await chat
      .withTemperature(0.7)
      .withParams({ seed: 123 })
      .ask("Hello", { maxTokens: 100 });

    expect(mockProvider.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
        max_tokens: 100,
        seed: 123
      })
    );
  });
});
