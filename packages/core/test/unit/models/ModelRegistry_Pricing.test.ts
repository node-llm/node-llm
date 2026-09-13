import { describe, it, expect, vi } from "vitest";
import { PricingRegistry } from "../../../src/models/PricingRegistry.js";

describe("PricingRegistry", () => {
  it("should return pricing for gpt-4o", () => {
    const pricing = PricingRegistry.getPricing("gpt-4o", "openai");
    expect(pricing).toBeDefined();
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(2.5);
    expect(pricing?.text_tokens?.standard?.output_per_million).toBe(10.0);
  });

  it("should return pricing for gpt-3.5-turbo via family matching", () => {
    const pricing = PricingRegistry.getPricing("gpt-3.5-turbo", "openai");
    expect(pricing).toBeDefined();
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(0.5);
  });

  it("should return pricing for the synced DeepSeek OpenRouter model", () => {
    const pricing = PricingRegistry.getPricing("deepseek/deepseek-chat", "openrouter");
    expect(pricing).toBeDefined();
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(0.2574);
  });

  it("should allow runtime registration", () => {
    PricingRegistry.register("openai", "new-model", {
      text_tokens: { standard: { input_per_million: 99, output_per_million: 99 } }
    });
    const pricing = PricingRegistry.getPricing("new-model", "openai");
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(99);
  });

  it("should support remote fetching", async () => {
    const mockData = {
      models: {
        "openai/remote-model": {
          text_tokens: { standard: { input_per_million: 123, output_per_million: 456 } }
        }
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData
      })
    );

    const success = await PricingRegistry.fetchUpdates("https://example.com/pricing.json");
    expect(success).toBe(true);

    const pricing = PricingRegistry.getPricing("remote-model", "openai");
    expect(pricing?.text_tokens?.standard?.input_per_million).toBe(123);

    vi.unstubAllGlobals();
  });
});
