import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicModels } from "../../../../src/providers/anthropic/Models.js";

describe("AnthropicModels", () => {
  const baseUrl = "https://api.anthropic.com/v1";
  const apiKey = "test-key";
  let models: AnthropicModels;

  beforeEach(() => {
    models = new AnthropicModels(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should fetch models from API", async () => {
    const mockResponse = {
      data: [{ id: "claude-3-5-sonnet-20240620", display_name: "Claude 3.5 Sonnet", created_at: "2024-06-20T00:00:00Z" }]
    };
    
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await models.execute();
    
    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/models`, expect.objectContaining({
      headers: expect.objectContaining({
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      })
    }));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("claude-3-5-sonnet-20240620");
    expect(result[0].name).toBe("Claude 3.5 Sonnet");
  });

  it("should fallback to static models on API failure", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      statusText: "Not Found"
    });

    const result = await models.execute();
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].provider).toBe("anthropic");
    // Should contain at least one of the static models
    expect(result.some(m => m.id.includes("claude"))).toBe(true);
  });

  it("should fallback to static models on fetch error", async () => {
    (fetch as any).mockRejectedValue(new Error("Network error"));

    const result = await models.execute();
    
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(m => m.id.includes("claude"))).toBe(true);
  });
});
