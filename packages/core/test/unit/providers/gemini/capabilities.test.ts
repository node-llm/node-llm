import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/gemini/Capabilities.js";

describe("Gemini Capabilities", () => {
  it("determines correct context window", () => {
    expect(Capabilities.getContextWindow("gemini-1.5-pro")).toBe(2_097_152);
    expect(Capabilities.getContextWindow("gemini-1.5-flash")).toBe(1_048_576);
    expect(Capabilities.getContextWindow("gemini-2.0-flash")).toBe(1_048_576);
  });

  it("determines correct max output tokens", () => {
    expect(Capabilities.getMaxOutputTokens("gemini-1.5-pro")).toBe(8_192);
    expect(Capabilities.getMaxOutputTokens("gemini-2.5-pro-exp-03-25")).toBe(64_000);
  });

  it("checks vision support", () => {
    expect(Capabilities.supportsVision("gemini-1.5-flash")).toBe(true);
    expect(Capabilities.supportsVision("text-embedding-004")).toBe(false);
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("gemini-1.5-pro")).toBe(true);
    expect(Capabilities.supportsTools("gemini-2.0-flash-lite")).toBe(true);
  });

  it("checks structured output support", () => {
    expect(Capabilities.supportsStructuredOutput("gemini-1.5-pro")).toBe(true);
    expect(Capabilities.supportsStructuredOutput("text-embedding-004")).toBe(false);
  });

  it("gets correct pricing", () => {
    const pricing = Capabilities.getPricing("gemini-1.5-flash");
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(0.075);
    expect(pricing?.text_tokens?.standard?.output_per_million).toBe(0.3);
  });
});
