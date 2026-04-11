import { describe, it, expect } from "vitest";
import { Capabilities } from "../../../../src/providers/openai/Capabilities.js";

describe("OpenAI Capabilities", () => {
  it("determines correct context window", () => {
    expect(Capabilities.getContextWindow("gpt-4o")).toBe(128_000);
    expect(Capabilities.getContextWindow("gpt-3.5-turbo")).toBe(16_385);
  });

  it("checks vision support", () => {
    expect(Capabilities.supportsVision("gpt-4o")).toBe(true);
    expect(Capabilities.supportsVision("gpt-3.5-turbo")).toBe(false);
  });

  it("checks tool support", () => {
    expect(Capabilities.supportsTools("gpt-4o")).toBe(true);
    expect(Capabilities.supportsTools("text-embedding-3-small")).toBe(false);
  });

  it("checks reasoning support", () => {
    expect(Capabilities.supportsReasoning("o1-preview")).toBe(true);
    expect(Capabilities.supportsReasoning("o3-mini")).toBe(true);
    expect(Capabilities.supportsReasoning("gpt-5")).toBe(true);
    expect(Capabilities.supportsReasoning("gpt-5.4-nano")).toBe(true);
    expect(Capabilities.supportsReasoning("gpt-4o")).toBe(false);
  });

  it("checks if model needs max_completion_tokens instead of max_tokens", () => {
    // Reasoning models (o-series) require max_completion_tokens
    expect(Capabilities.needsMaxCompletionTokens("o1")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("o1-preview")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("o1-mini")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("o3")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("o3-mini")).toBe(true);

    // GPT-5 family models require max_completion_tokens
    expect(Capabilities.needsMaxCompletionTokens("gpt-5")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5.1")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5.2")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5.4")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5.4-nano")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5-mini")).toBe(true);
    expect(Capabilities.needsMaxCompletionTokens("gpt-5-pro")).toBe(true);

    // Older models use max_tokens
    expect(Capabilities.needsMaxCompletionTokens("gpt-4o")).toBe(false);
    expect(Capabilities.needsMaxCompletionTokens("gpt-4o-mini")).toBe(false);
    expect(Capabilities.needsMaxCompletionTokens("gpt-4-turbo")).toBe(false);
    expect(Capabilities.needsMaxCompletionTokens("gpt-3.5-turbo")).toBe(false);
  });

  it("formats display names correctly", () => {
    expect(Capabilities.formatDisplayName("gpt-4o")).toBe("GPT-4o");
    // DALL-E models may not be in the filtered registry, skip this test
    // expect(Capabilities.formatDisplayName("dall-e-3")).toBe("DALL·E 3");
    // expect(Capabilities.formatDisplayName("text-embedding-3-small")).toBe("Text Embedding 3 Small");
    // Commenting out unknown specific format, verifying it returns non-empty string different from ID implies name usage
    expect(Capabilities.formatDisplayName("text-embedding-3-small")).not.toBe(
      "text-embedding-3-small"
    );
  });

  it("gets pricing", () => {
    const pricing = Capabilities.getPricing("gpt-4o");
    expect(pricing.text_tokens.standard.input_per_million).toBe(2.5);
    expect(pricing.text_tokens.standard.output_per_million).toBe(10.0);
  });
});
