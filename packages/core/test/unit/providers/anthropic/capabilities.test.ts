import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/anthropic/Capabilities.js";

describe("Anthropic Capabilities", () => {
  it("determines correct context window", () => {
    expect(Capabilities.getContextWindow("claude-3-7-sonnet")).toBe(200_000);
    expect(Capabilities.getContextWindow("claude-2")).toBe(200_000);
  });

  it("determines correct max output tokens", () => {
    expect(Capabilities.getMaxOutputTokens("claude-sonnet-4-5-20250929")).toBe(64000);
    expect(Capabilities.getMaxOutputTokens("claude-haiku-4-5-20251001")).toBe(64000);
    expect(Capabilities.getMaxOutputTokens("claude-opus-4-5-20251101")).toBe(64000);
    expect(Capabilities.getMaxOutputTokens("claude-opus-5")).toBe(128000);
    expect(Capabilities.getMaxOutputTokens("claude-2")).toBe(8192); // unknown model -> fallback
  });

  it("checks vision support", () => {
    expect(Capabilities.supportsVision("claude-sonnet-4-5")).toBe(true);
    expect(Capabilities.supportsVision("claude-2")).toBe(false); // unknown model -> false
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("claude-opus-4-5-20251101")).toBe(true);
    expect(Capabilities.supportsTools("claude-2")).toBe(false);
  });

  it("checks extended thinking support", () => {
    expect(Capabilities.supportsExtendedThinking("claude-sonnet-4-5")).toBe(true);
    expect(Capabilities.supportsExtendedThinking("claude-2")).toBe(false);
  });

  it("gets correct pricing", () => {
    const pricing = Capabilities.getPricing("claude-3-7-sonnet");

    // Standard pricing
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(3.0);
    expect(pricing?.text_tokens?.standard?.output_per_million).toBe(15.0);
    expect(pricing?.text_tokens?.standard?.reasoning_output_per_million).toBe(37.5); // 15.0 * 2.5

    // Batch pricing
    expect(pricing?.text_tokens?.batch?.input_per_million).toBe(1.5); // 3.0 * 0.5
    expect(pricing?.text_tokens?.batch?.output_per_million).toBe(7.5); // 15.0 * 0.5
    expect(pricing?.text_tokens?.batch?.reasoning_output_per_million).toBe(18.75); // 15.0 * 1.25
  });

  it("gets correct pricing for non-reasoning models", () => {
    const pricing = Capabilities.getPricing("claude-3-5-sonnet");
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(3.0);
    expect(pricing?.text_tokens?.standard?.output_per_million).toBe(15.0);
    expect(pricing?.text_tokens?.standard?.reasoning_output_per_million).toBeUndefined();
  });
});
