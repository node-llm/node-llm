import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiModels } from "../../../../src/providers/gemini/Models.js";

describe("GeminiModels", () => {
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const apiKey = "test-key";
  const models = new GeminiModels(baseUrl, apiKey);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should return models from registry and simulate API call", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [
          { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", description: "Efficient model" }
        ]
      })
    } as Response);

    const result = await models.execute();
    expect(result.length).toBe(1);
    
    const gemini = result.find(m => m.id.includes("gemini"));
    expect(gemini).toBeDefined();
    expect(gemini?.provider).toBe("gemini");
  });
});
