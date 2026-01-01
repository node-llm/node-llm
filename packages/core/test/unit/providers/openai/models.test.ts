import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIModels } from "../../../../src/providers/openai/Models.js";

describe("OpenAIModels", () => {
  const baseUrl = "https://api.openai.com/v1";
  const apiKey = "test-key";
  const models = new OpenAIModels(baseUrl, apiKey);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should return models from registry and simulate API call", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: "gpt-4o", created: 123, owned_by: "openai" },
          { id: "gpt-4o-mini", created: 124, owned_by: "openai" }
        ]
      })
    } as Response);

    const result = await models.execute();
    expect(result.length).toBe(2);
    
    const gpt4o = result.find(m => m.id === "gpt-4o");
    expect(gpt4o).toBeDefined();
    expect(gpt4o?.provider).toBe("openai");
    expect(gpt4o?.max_output_tokens).toBeGreaterThan(0);
  });
});
