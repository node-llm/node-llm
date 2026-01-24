import { describe, it, expect } from "vitest";
import { ModelRegistry } from "../../../src/models/ModelRegistry.js";

describe("ModelRegistry - Filtered Sync Verification", () => {
  it("should have loaded the filtered modelsData", () => {
    const allModels = ModelRegistry.all();
    expect(allModels.length).toBeGreaterThan(200); // Filtered to supported providers only

    // Check that we only have supported providers
    const providers = new Set(allModels.map((m) => m.provider));
    const supported = [
      "openai",
      "anthropic",
      "gemini",
      "deepseek",
      "openrouter",
      "ollama",
      "bedrock"
    ];

    // Convert Set to Array for easier comparison
    const providerArray = Array.from(providers);
    providerArray.forEach((p) => {
      expect(supported).toContain(p);
    });
  });

  it("should find the new models like Claude 3.7", () => {
    const claude37 = ModelRegistry.find("claude-3-7-sonnet-20250219");
    expect(claude37).toBeDefined();
    expect(claude37?.name).toBe("Claude Sonnet 3.7");
    expect(claude37?.context_window).toBe(200000);
  });

  it("should find the new OpenAI models like gpt-4o", () => {
    const gpt4o = ModelRegistry.find("gpt-4o");
    expect(gpt4o).toBeDefined();
    expect(gpt4o?.provider).toBe("openai");
  });

  it("should calculate costs using the new pricing data", () => {
    // GPT-4o pricing: $2.50 / $10.00
    const usage = { input_tokens: 1_000_000, output_tokens: 1_000_000, total_tokens: 2_000_000 };
    const result = ModelRegistry.calculateCost(usage, "gpt-4o", "openai");

    // calculateCost returns the usage object with added cost properties
    expect("cost" in result).toBe(true);
    if ("cost" in result) {
      expect(result.cost).toBe(12.5); // 2.5 + 10
    }
  });

  // Note: Ollama models are not in models.dev as they're dynamically fetched from local server
  it("should have models from all major providers", () => {
    const providers = new Set(ModelRegistry.all().map((m) => m.provider));
    expect(providers.has("openai")).toBe(true);
    expect(providers.has("anthropic")).toBe(true);
    expect(providers.has("gemini")).toBe(true);
  });
});
