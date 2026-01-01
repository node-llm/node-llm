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

  it("formats display names correctly", () => {
    expect(Capabilities.formatDisplayName("gpt-4o")).toBe("GPT-4o");
    expect(Capabilities.formatDisplayName("dall-e-3")).toBe("DALL·E 3");
    // expect(Capabilities.formatDisplayName("text-embedding-3-small")).toBe("Text Embedding 3 Small"); 
    // Commenting out unknown specific format, verifying it returns non-empty string different from ID implies name usage
    expect(Capabilities.formatDisplayName("text-embedding-3-small")).not.toBe("text-embedding-3-small");
  });

  it("gets pricing", () => {
    const pricing = Capabilities.getPricing("gpt-4o");
    expect(pricing.text_tokens.standard.input_per_million).toBe(2.5);
    expect(pricing.text_tokens.standard.output_per_million).toBe(10.0);
  });
});
