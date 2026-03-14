import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";

describe("Request Timeout Configuration", () => {
  it("should have default timeout of 30 seconds", () => {
    const llm = createLLM();
    expect(llm.config.requestTimeout).toBe(30000);
  });

  it("should accept requestTimeout in global config", () => {
    const llm = createLLM({ requestTimeout: 60000 });
    expect(llm.config.requestTimeout).toBe(60000);
  });

  it("should allow per-chat timeout configuration", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key"
    });
    const chat = llm.chat("gpt-4o", { requestTimeout: 45000 });
    expect(
      (chat as unknown as { options: { requestTimeout: number } }).options.requestTimeout
    ).toBe(45000);
  });

  it("should propagate requestTimeout from createLLM to chat (issue #47)", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      requestTimeout: 60000
    });

    const chat = llm.chat("gpt-4o");
    expect(
      (chat as unknown as { options: { requestTimeout: number } }).options.requestTimeout
    ).toBe(60000);
  });

  it("should allow per-chat timeout to override createLLM timeout", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      requestTimeout: 60000
    });

    const chat = llm.chat("gpt-4o", { requestTimeout: 90000 });
    expect(
      (chat as unknown as { options: { requestTimeout: number } }).options.requestTimeout
    ).toBe(90000);
  });
});

describe("Config Propagation from createLLM to Chat", () => {
  it("should propagate maxTokens from createLLM to chat", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      maxTokens: 8192
    });

    const chat = llm.chat("gpt-4o");
    expect((chat as unknown as { options: { maxTokens: number } }).options.maxTokens).toBe(8192);
  });

  it("should propagate maxToolCalls from createLLM to chat", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      maxToolCalls: 10
    });

    const chat = llm.chat("gpt-4o");
    expect((chat as unknown as { options: { maxToolCalls: number } }).options.maxToolCalls).toBe(
      10
    );
  });

  it("should propagate all config values together", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      requestTimeout: 120000,
      maxTokens: 16384,
      maxToolCalls: 15
    });

    const chat = llm.chat("gpt-4o");
    const chatOptions = (chat as unknown as { options: Record<string, unknown> }).options;

    expect(chatOptions.requestTimeout).toBe(120000);
    expect(chatOptions.maxTokens).toBe(16384);
    expect(chatOptions.maxToolCalls).toBe(15);
  });

  it("should allow per-chat options to override createLLM config", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key",
      requestTimeout: 60000,
      maxTokens: 4096,
      maxToolCalls: 5
    });

    const chat = llm.chat("gpt-4o", {
      requestTimeout: 90000,
      maxTokens: 8192,
      maxToolCalls: 10
    });
    const chatOptions = (chat as unknown as { options: Record<string, unknown> }).options;

    expect(chatOptions.requestTimeout).toBe(90000);
    expect(chatOptions.maxTokens).toBe(8192);
    expect(chatOptions.maxToolCalls).toBe(10);
  });

  it("should use defaults when createLLM does not specify values", () => {
    const llm = createLLM({
      provider: "openai",
      openaiApiKey: "test-key"
    });

    const chat = llm.chat("gpt-4o");
    const chatOptions = (chat as unknown as { options: Record<string, unknown> }).options;

    expect(chatOptions.requestTimeout).toBe(30000);
    expect(chatOptions.maxTokens).toBe(4096);
    expect(chatOptions.maxToolCalls).toBe(5);
  });
});
