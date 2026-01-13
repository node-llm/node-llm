import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/anthropic/Capabilities.js";

describe("Anthropic Capabilities", () => {
  it("determines correct context window", () => {
    expect(Capabilities.getContextWindow("claude-3-7-sonnet")).toBe(200_000);
    expect(Capabilities.getContextWindow("claude-2")).toBe(200_000);
  });

  it("determines correct max output tokens", () => {
    expect(Capabilities.getMaxOutputTokens("claude-3-7-sonnet-20250219")).toBe(64_000); // Updated to actual value from models.dev
    expect(Capabilities.getMaxOutputTokens("claude-3-5-sonnet-20241022")).toBe(8_192); // Updated to use full model ID
    expect(Capabilities.getMaxOutputTokens("claude-3-5-haiku-20241022")).toBe(8_192); // Updated to use full model ID
    expect(Capabilities.getMaxOutputTokens("claude-3-opus-20240229")).toBe(4_096); // Updated to use full model ID
    expect(Capabilities.getMaxOutputTokens("claude-2")).toBe(4_096);
  });

  it("checks vision support", () => {
    expect(Capabilities.supportsVision("claude-3-7-sonnet")).toBe(true);
    expect(Capabilities.supportsVision("claude-2")).toBe(false); // Claude 2 doesn't support vision
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("claude-3-opus")).toBe(true);
    expect(Capabilities.supportsTools("claude-2")).toBe(false);
  });

  it("checks extended thinking support", () => {
    expect(Capabilities.supportsExtendedThinking("claude-3-7-sonnet")).toBe(true);
    expect(Capabilities.supportsExtendedThinking("claude-3-5-sonnet")).toBe(false);
  });

  it("gets correct pricing", () => {
    const pricing = Capabilities.getPricing("claude-3-7-sonnet");
    
    // Standard pricing
    expect(pricing.text_tokens.standard.input_per_million).toBe(3.0);
    expect(pricing.text_tokens.standard.output_per_million).toBe(15.0);
    expect(pricing.text_tokens.standard.reasoning_output_per_million).toBe(37.5); // 15.0 * 2.5

    // Batch pricing
    expect(pricing.text_tokens.batch.input_per_million).toBe(1.5); // 3.0 * 0.5
    expect(pricing.text_tokens.batch.output_per_million).toBe(7.5); // 15.0 * 0.5
    expect(pricing.text_tokens.batch.reasoning_output_per_million).toBe(18.75); // 15.0 * 1.25
  });

  it("gets correct pricing for non-reasoning models", () => {
    const pricing = Capabilities.getPricing("claude-3-5-sonnet");
    expect(pricing.text_tokens.standard.input_per_million).toBe(3.0);
    expect(pricing.text_tokens.standard.output_per_million).toBe(15.0);
    expect(pricing.text_tokens.standard.reasoning_output_per_million).toBeUndefined();
  });
});
