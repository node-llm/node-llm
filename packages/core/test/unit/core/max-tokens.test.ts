import { describe, it, expect, beforeEach } from "vitest";
import { NodeLLMCore } from "../../../src/llm.js";
import { config } from "../../../src/config.js";

describe("Global MaxTokens Configuration", () => {
  beforeEach(() => {
    // Reset to default
    config.maxTokens = 4096;
  });

  it("should have default maxTokens of 4096", () => {
    const llm = new NodeLLMCore();
    expect(llm.config.maxTokens).toBe(4096);
  });

  it("should accept maxTokens in global config", () => {
    const llm = new NodeLLMCore();
    llm.configure({
      maxTokens: 8192,
    });

    expect(llm.config.maxTokens).toBe(8192);
  });

  it("should allow per-chat maxTokens configuration", () => {
    const llm = new NodeLLMCore();
    llm.configure({ 
      provider: "openai",
      openaiApiKey: "test-key"
    });
    const chat = llm.chat("gpt-4o", { maxTokens: 16384 });
    
    // The maxTokens should be stored in chat options
    expect((chat as any).options.maxTokens).toBe(16384);
  });

  it("should use global maxTokens as fallback when not specified", () => {
    const llm = new NodeLLMCore();
    llm.configure({
      maxTokens: 2048,
      provider: "openai",
      openaiApiKey: "test-key"
    });
    
    const chat = llm.chat("gpt-4o");
    
    // Chat should fall back to global config
    expect((chat as any).options.maxTokens).toBeUndefined();
    expect(llm.config.maxTokens).toBe(2048);
  });
});
