import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIModels } from "../../../../src/providers/openai/Models.js";

describe("OpenAIModels", () => {
  const baseUrl = "https://api.openai.com/v1";
  const apiKey = "test-key";
  let models: OpenAIModels;

  beforeEach(() => {
    models = new OpenAIModels(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should fetch models and enrich with capabilities", async () => {
    const mockResponse = {
      data: [
        { id: "gpt-4o", owned_by: "openai" },
        { id: "text-embedding-3-small", owned_by: "openai" }
      ]
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await models.execute();

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/models`, expect.objectContaining({
      headers: { "Authorization": "Bearer test-key" }
    }));
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("gpt-4o");
    expect(result[0].name).toBe("GPT-4o");
    expect(result[0].context_window).toBe(128_000);
    expect(result[1].id).toBe("text-embedding-3-small");
    expect(result[1].context_window).toBeNull();
  });

  it("should handle error response", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized")
    });

    await expect(models.execute()).rejects.toThrow("OpenAI error (401): Unauthorized");
  });
});
