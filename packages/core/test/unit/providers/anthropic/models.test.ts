import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicModels } from "../../../../src/providers/anthropic/Models.js";

describe("AnthropicModels", () => {
  const baseUrl = "https://api.anthropic.com/v1";
  const apiKey = "test-key";
  const models = new AnthropicModels(baseUrl, apiKey);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should return models from registry and simulate API call", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: "claude-3-5-sonnet-20240620", display_name: "Claude 3.5 Sonnet", created_at: "2024-06-20T00:00:00Z" }
        ]
      })
    } as Response);

    const result = await models.execute();
    expect(result.length).toBe(1);
    
    const claude = result.find(m => m.id.includes("claude"));
    expect(claude).toBeDefined();
    expect(claude?.provider).toBe("anthropic");
  });
});
