import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { MistralModels } from "../../../../src/providers/mistral/Models.js";
import { ModelRegistry } from "../../../../src/models/ModelRegistry.js";

describe("MistralModels", () => {
  const baseUrl = "https://api.test";
  const apiKey = "test-key";
  let handler: MistralModels;

  beforeEach(() => {
    handler = new MistralModels(baseUrl, apiKey);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch models from API", async () => {
    const mockResponse = {
      object: "list",
      data: [
        { id: "mistral-large-latest", object: "model", owned_by: "mistralai" },
        { id: "mistral-small-latest", object: "model", owned_by: "mistralai" }
      ]
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const models = await handler.execute();

    expect(models).toHaveLength(2);
    expect(models[0].id).toBe("mistral-large-latest");
    expect(models[1].id).toBe("mistral-small-latest");
  });

  it("should fallback to local registry on API error", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: false
    });

    const registryModels = ModelRegistry.all().filter((m) => m.provider === "mistral");
    expect(registryModels.length).toBeGreaterThan(0);

    const models = await handler.execute();

    expect(models.length).toBeGreaterThanOrEqual(1);
    expect(models.find((m) => m.id === "mistral-large-latest")).toBeDefined();
  });

  it("should include context window from capabilities", async () => {
    const mockResponse = {
      object: "list",
      data: [{ id: "mistral-large-latest", object: "model", owned_by: "mistralai" }]
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const models = await handler.execute();

    expect(models[0].context_window).toBe(128000);
  });
});
