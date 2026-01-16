import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";

describe("Global MaxTokens Configuration", () => {
  it("should have default maxTokens of 4096", () => {
    const llm = createLLM();
    expect(llm.config.maxTokens).toBe(4096);
  });

  it("should accept maxTokens in global config", () => {
    const llm = createLLM({ maxTokens: 8192 });
    expect(llm.config.maxTokens).toBe(8192);
  });

  it("should allow per-chat maxTokens configuration", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key"
    });
    const chat = llm.chat("gpt-4o", { maxTokens: 16384 });

    // The maxTokens should be stored in chat options
    expect(((chat as unknown) as { options: { maxTokens: number } }).options.maxTokens).toBe(16384);
  });

  it("should use global maxTokens as fallback when not specified", () => {
    const llm = createLLM({
      maxTokens: 2048,
      provider: "openai",
      openaiApiKey: "test-key"
    });

    const chat = llm.chat("gpt-4o");

    // Chat should fall back to global config
    expect(((chat as unknown) as { options: { maxTokens?: number } }).options.maxTokens).toBeUndefined();
    expect(llm.config.maxTokens).toBe(2048);
  });
});
