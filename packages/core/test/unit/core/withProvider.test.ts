import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";

describe("LLMCore.withProvider()", () => {
  it("should create a scoped instance with the specified provider", () => {
    // Create an isolated base instance
    const base = createLLM({ openaiApiKey: "test-key" });
    const scoped = base.withProvider("openai");

    // Scoped instance should be a different object
    expect(scoped).not.toBe(base);

    // Should have access to the same methods
    expect(typeof scoped.chat).toBe("function");
    // configure should not exist on instances created via factory/withProvider
    expect((scoped as unknown as Record<string, unknown>).configure).toBeUndefined();
  });

  it("should inherit global config by default", () => {
    const base = createLLM({ openaiApiKey: "global-openai-key" });

    const scoped = base.withProvider("openai");

    // Should have inherited the global config
    expect(scoped.config.openaiApiKey).toBe("global-openai-key");
  });

  it("should accept scoped configuration overrides", () => {
    const base = createLLM({ anthropicApiKey: "global-anthropic-key" });

    const scoped = base.withProvider("anthropic", {
      anthropicApiKey: "scoped-anthropic-key"
    });

    // Scoped instance should use the override
    expect(scoped.config.anthropicApiKey).toBe("scoped-anthropic-key");

    // Base config should remain unchanged (immutability)
    expect(base.config.anthropicApiKey).toBe("global-anthropic-key");
  });

  it("should support multiple scoped instances with different configs", () => {
    const base = createLLM();

    const scoped1 = base.withProvider("anthropic", {
      anthropicApiKey: "key-1"
    });

    const scoped2 = base.withProvider("anthropic", {
      anthropicApiKey: "key-2"
    });

    // Each scope should have its own config
    expect(scoped1.config.anthropicApiKey).toBe("key-1");
    expect(scoped2.config.anthropicApiKey).toBe("key-2");

    // They should be different instances
    expect(scoped1).not.toBe(scoped2);
  });

  it("should allow partial config overrides", () => {
    const base = createLLM({
      openaiApiKey: "global-openai",
      anthropicApiKey: "global-anthropic"
    });

    const scoped = base.withProvider("openai", {
      openaiApiKey: "scoped-openai"
      // anthropicApiKey not overridden
    });

    expect(scoped.config.openaiApiKey).toBe("scoped-openai");
    expect(scoped.config.anthropicApiKey).toBe("global-anthropic");
  });

  it("should support custom base URLs in scoped config", () => {
    const base = createLLM({ anthropicApiKey: "dummy" });
    const scoped = base.withProvider("anthropic", {
      anthropicApiBase: "https://custom-proxy.example.com"
    });

    expect(scoped.config.anthropicApiBase).toBe("https://custom-proxy.example.com");
  });
});
