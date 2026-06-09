import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/gemini/Capabilities.js";

describe("Gemini Capabilities", () => {
  it("determines correct context window", () => {
    // Using actual model IDs from models.dev
    expect(Capabilities.getContextWindow("gemini-1.5-pro")).toBe(32_768); // Default value when not in registry
    expect(Capabilities.getContextWindow("gemini-1.5-flash")).toBe(32_768); // Default value when not in registry
    expect(Capabilities.getContextWindow("gemini-2.0-flash")).toBe(1_048_576);
  });

  it("determines correct max output tokens", () => {
    expect(Capabilities.getMaxOutputTokens("gemini-1.5-pro")).toBe(4_096); // Default value
    expect(Capabilities.getMaxOutputTokens("gemini-2.5-pro-preview-03-25")).toBe(65_536);
  });

  it("checks vision support", () => {
    expect(Capabilities.supportsVision("gemini-1.5-flash")).toBe(false); // Not in registry
    expect(Capabilities.supportsVision("text-embedding-004")).toBe(false);
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("gemini-1.5-pro")).toBe(false); // Not in registry
    expect(Capabilities.supportsTools("gemini-2.0-flash-lite")).toBe(true); // In registry
  });

  it("checks structured output support", () => {
    expect(Capabilities.supportsStructuredOutput("gemini-1.5-pro")).toBe(false); // Not in registry
    expect(Capabilities.supportsStructuredOutput("text-embedding-004")).toBe(false);
  });

  it("gets correct pricing", () => {
    const pricing = Capabilities.getPricing("gemini-1.5-flash");
    expect(pricing).toBeUndefined(); // Not in registry or patterns
  });
});
