import { describe, it, expect } from "vitest";
import { ModelRegistry } from "../../../src/models/ModelRegistry.js";
import { PricingRegistry } from "../../../src/models/PricingRegistry.js";
import { toUsage } from "../../../src/providers/anthropic/Utils.js";

describe("prompt cache usage and cost", () => {
  PricingRegistry.register("anthropic", "cache-cost-model", {
    text_tokens: {
      standard: {
        input_per_million: 3,
        cached_input_per_million: 0.3,
        cache_write_per_million: 3.75,
        output_per_million: 15
      }
    }
  });

  it("counts Anthropic cache reads and writes as input tokens", () => {
    const usage = toUsage({
      input_tokens: 100,
      output_tokens: 20,
      cache_read_input_tokens: 9000,
      cache_creation_input_tokens: 400
    });

    expect(usage).toEqual({
      input_tokens: 9500,
      output_tokens: 20,
      total_tokens: 9520,
      cached_tokens: 9000,
      cache_creation_tokens: 400
    });
  });

  it("prices uncached input, cache reads and cache writes at their own rates", () => {
    const usage = toUsage({
      input_tokens: 1_000_000,
      output_tokens: 0,
      cache_read_input_tokens: 2_000_000,
      cache_creation_input_tokens: 1_000_000
    });

    const { input_cost } = ModelRegistry.calculateCost(usage, "cache-cost-model", "anthropic");

    expect(input_cost).toBeCloseTo(3 + 2 * 0.3 + 3.75);
  });

  it("prices cache writes as normal input when the model has no cache write price", () => {
    PricingRegistry.register("openai", "cache-cost-no-write", {
      text_tokens: { standard: { input_per_million: 2, output_per_million: 8 } }
    });
    const usage = {
      input_tokens: 1_000_000,
      output_tokens: 0,
      total_tokens: 1_000_000,
      cache_creation_tokens: 1_000_000
    };

    const { input_cost } = ModelRegistry.calculateCost(usage, "cache-cost-no-write", "openai");

    expect(input_cost).toBe(2);
  });
});
