import { describe, it, expect, vi, beforeEach } from "vitest";
import { XAIModels } from "../../../../src/providers/xai/Models.js";

describe("XAIModels", () => {
  const baseUrl = "https://api.x.ai/v1";
  const apiKey = "test-key";
  const models = new XAIModels(baseUrl, apiKey);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should return models from the API response", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: "grok-3", created: 1234567890, owned_by: "xai" },
          { id: "grok-2-1212", created: 1234567891, owned_by: "xai" }
        ]
      })
    } as Response);

    const result = await models.execute();
    expect(result.length).toBe(2);

    const grok3 = result.find((m) => m.id === "grok-3");
    expect(grok3).toBeDefined();
    expect(grok3?.provider).toBe("xai");
  });

  it("should enrich models with registry data when available", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: "grok-3", created: 1234567890, owned_by: "xai" }]
      })
    } as Response);

    const result = await models.execute();
    const grok3 = result.find((m) => m.id === "grok-3");
    // Registry enrichment should set context_window > 0 for known models
    expect(grok3?.context_window).toBeGreaterThan(0);
  });
});
