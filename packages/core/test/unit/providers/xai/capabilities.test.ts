import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/xai/Capabilities.js";

describe("xAI Capabilities", () => {
  it("checks vision support", () => {
    expect(Capabilities.supportsVision("grok-2-vision-1212")).toBe(true);
    expect(Capabilities.supportsVision("grok-vision-beta")).toBe(true);
    expect(Capabilities.supportsVision("grok-3")).toBe(false);
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("grok-3")).toBe(true);
    expect(Capabilities.supportsTools("grok-2-1212")).toBe(true);
    // Image generation models do not support tools
    expect(Capabilities.supportsTools("grok-imagine-image")).toBe(false);
  });

  it("checks structured output support", () => {
    expect(Capabilities.supportsStructuredOutput("grok-3")).toBe(true);
    expect(Capabilities.supportsStructuredOutput("grok-imagine-image")).toBe(false);
  });

  it("checks image generation support", () => {
    expect(Capabilities.supportsImageGeneration("grok-imagine-image")).toBe(true);
    expect(Capabilities.supportsImageGeneration("grok-3")).toBe(false);
  });

  it("checks reasoning support", () => {
    expect(Capabilities.supportsReasoning("grok-3-mini")).toBe(true);
    expect(Capabilities.supportsReasoning("grok-3")).toBe(false);
  });

  it("checks embeddings support (xAI has none)", () => {
    expect(Capabilities.supportsEmbeddings("grok-3")).toBe(false);
  });

  it("checks transcription support (xAI has none)", () => {
    expect(Capabilities.supportsTranscription("grok-3")).toBe(false);
  });

  it("checks moderation support (xAI has none)", () => {
    expect(Capabilities.supportsModeration("grok-3")).toBe(false);
  });

  it("returns a context window for known models", () => {
    // grok-3 has 131072 context from models.dev sync
    expect(Capabilities.getContextWindow("grok-3")).toBeGreaterThan(0);
  });

  it("returns default context window for unknown models", () => {
    expect(Capabilities.getContextWindow("grok-unknown-model")).toBe(128000);
  });
});
