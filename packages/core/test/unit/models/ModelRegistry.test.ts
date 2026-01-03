import { describe, it, expect } from "vitest";
import { ModelRegistry } from "../../../src/models/ModelRegistry.js";

describe("ModelRegistry - Filtered Sync Verification", () => {
  it("should have loaded the filtered modelsData", () => {
    const allModels = ModelRegistry.all();
    expect(allModels.length).toBeGreaterThan(500);
    
    // Check that we only have supported providers
    const providers = new Set(allModels.map(m => m.provider));
    const supported = ['openai', 'anthropic', 'gemini', 'deepseek', 'openrouter', 'ollama'];
    
    // Convert Set to Array for easier comparison
    const providerArray = Array.from(providers);
    providerArray.forEach(p => {
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
    const cost = ModelRegistry.calculateCost(usage, "gpt-4o", "openai");
    
    expect(cost.cost).toBe(12.5); // 2.5 + 10
  });

  it("should still have Ollama models", () => {
    const llama = ModelRegistry.find("llama3");
    expect(llama).toBeDefined();
    expect(llama?.provider).toBe("ollama");
  });
});
 bitumen: 102
 bitumen: 102
 bitumen: 102
