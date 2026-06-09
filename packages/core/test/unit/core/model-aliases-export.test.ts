import { describe, it, expect } from "vitest";
import { MODEL_ALIASES, resolveModelAlias } from "../../../src/index.js";

describe("MODEL_ALIASES Export", () => {
  it("should export MODEL_ALIASES object", () => {
    expect(MODEL_ALIASES).toBeDefined();
    expect(typeof MODEL_ALIASES).toBe("object");
  });

  it("should contain known aliases", () => {
    expect(MODEL_ALIASES["claude-3-5-haiku"]).toBeDefined();
    expect(MODEL_ALIASES["claude-3-5-haiku"]["anthropic"]).toBe("claude-3-5-haiku-20241022");

    expect(MODEL_ALIASES["gpt-4o"]).toBeDefined();
    expect(MODEL_ALIASES["gpt-4o"]["openai"]).toBe("gpt-4o");
  });

  it("should allow programmatic alias validation", () => {
    const userInput = "claude-3-5-haiku";
    const isValidAlias = userInput in MODEL_ALIASES;

    expect(isValidAlias).toBe(true);
  });

  it("should allow checking provider support", () => {
    const alias = "claude-3-5-haiku";
    const provider = "anthropic";

    const hasProviderMapping = MODEL_ALIASES[alias]?.[provider] !== undefined;

    expect(hasProviderMapping).toBe(true);
  });

  it("should export resolveModelAlias function", () => {
    expect(typeof resolveModelAlias).toBe("function");

    const result = resolveModelAlias("claude-3-5-haiku", "anthropic");
    expect(result).toBe("claude-3-5-haiku-20241022");
  });

  it("should allow listing all aliases", () => {
    const allAliases = Object.keys(MODEL_ALIASES);

    expect(allAliases.length).toBeGreaterThan(0);
    expect(allAliases).toContain("claude-3-5-haiku");
    expect(allAliases).toContain("gpt-4o");
  });

  it("should allow listing providers for an alias", () => {
    const providers = Object.keys(MODEL_ALIASES["claude-3-5-haiku"]);

    expect(providers).toContain("anthropic");
    expect(providers).toContain("openrouter");
  });
});
