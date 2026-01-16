import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { DeepSeekModels } from "../../../../src/providers/deepseek/Models.js";
import { ModelRegistry } from "../../../../src/models/ModelRegistry.js";

describe("DeepSeekModels", () => {
  const baseUrl = "https://api.test";
  const apiKey = "test-key";
  let handler: DeepSeekModels;

  beforeEach(() => {
    handler = new DeepSeekModels(baseUrl, apiKey);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch models from API", async () => {
    const mockResponse = {
      object: "list",
      data: [{ id: "deepseek-chat", object: "model", owned_by: "deepseek" }]
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const models = await handler.execute();

    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("deepseek-chat");
    expect(models[0].context_window).toBe(128000); // From Capabilities default/check
  });

  it("should fallback to local registry on API error", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: false
    });

    // Ensure registry has our models
    const registryModels = ModelRegistry.all().filter((m) => m.provider === "deepseek");
    expect(registryModels.length).toBeGreaterThan(0);

    const models = await handler.execute();

    expect(models.length).toBeGreaterThanOrEqual(2); // deepseek-chat and reasoner
    expect(models.find((m) => m.id === "deepseek-chat")).toBeDefined();
  });
});
