import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiModels } from "../../../../src/providers/gemini/Models.js";

describe("GeminiModels", () => {
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const apiKey = "test-key";
  let models: GeminiModels;

  beforeEach(() => {
    models = new GeminiModels(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should fetch and filter models", async () => {
    const mockResponse = {
      models: [
        { 
          name: "models/gemini-1.5-flash", 
          displayName: "Gemini 1.5 Flash", 
          supportedGenerationMethods: ["generateContent"] 
        },
        { 
          name: "models/embedding-001", 
          displayName: "Embedding 001", 
          supportedGenerationMethods: ["embedContent"] 
        }
      ]
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await models.execute();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/models?key=test-key"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("gemini-1.5-flash");
    expect(result[0].provider).toBe("gemini");
  });

  it("should handle error response", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve("Permission denied")
    });

    await expect(models.execute()).rejects.toThrow("Gemini error (403): Permission denied");
  });
});
