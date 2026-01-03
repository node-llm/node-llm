import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeLLM } from "../../../src/llm.js";
import { Provider } from "../../../src/providers/Provider.js";

describe("Moderation Unit Tests", () => {
  let mockProvider: Provider;

  beforeEach(() => {
    mockProvider = {
      chat: vi.fn(),
      moderate: vi.fn().mockResolvedValue({
        id: "mod-123",
        model: "text-moderation-latest",
        results: [
          {
            flagged: false,
            categories: { violence: false },
            category_scores: { violence: 0.01 }
          }
        ]
      })
    };
    NodeLLM.configure({ provider: mockProvider });
  });

  it("should call provider.moderate with correct arguments", async () => {
    await NodeLLM.moderate("hello world", { model: "custom-mod" });
    expect(mockProvider.moderate).toHaveBeenCalledWith({
      input: "hello world",
      model: "custom-mod"
    });
  });

  it("should use defaultModerationModel if configured", async () => {
    NodeLLM.configure({ provider: mockProvider, defaultModerationModel: "default-mod" });
    await NodeLLM.moderate("hello world");
    expect(mockProvider.moderate).toHaveBeenCalledWith({
      input: "hello world",
      model: "default-mod"
    });
  });

  it("should return a Moderation object with correct properties", async () => {
    const result = await NodeLLM.moderate("safe text");
    expect(result.id).toBe("mod-123");
    expect(result.model).toBe("text-moderation-latest");
    expect(result.flagged).toBe(false);
    expect(result.results[0].flagged).toBe(false);
  });

  it("should correctly detect flagged content", async () => {
    (mockProvider.moderate as any).mockResolvedValueOnce({
      id: "mod-456",
      model: "text-moderation-latest",
      results: [
        {
          flagged: true,
          categories: { violence: true },
          category_scores: { violence: 0.99 }
        }
      ]
    });

    const result = await NodeLLM.moderate("unsafe text");
    expect(result.flagged).toBe(true);
    expect(result.isFlagged()).toBe(true);
    expect(result.flaggedCategories).toContain("violence");
    expect(result.categories.violence).toBe(true);
    expect(result.categoryScores.violence).toBe(0.99);
  });

  it("should support Ruby-style aliases", async () => {
    (mockProvider.moderate as any).mockResolvedValueOnce({
      id: "mod-789",
      model: "text-moderation-latest",
      results: [{ flagged: true, categories: { "hate/threatening": true }, category_scores: { "hate/threatening": 0.8 } }]
    });

    const result = await NodeLLM.moderate("threat");
    expect(result.flagged_categories).toContain("hate/threatening");
    expect(result.category_scores["hate/threatening"]).toBe(0.8);
  });

  it("should aggregate flagged categories across multiple results", async () => {
    (mockProvider.moderate as any).mockResolvedValueOnce({
      id: "mod-multi",
      model: "text-moderation-latest",
      results: [
        { flagged: true, categories: { violence: true }, category_scores: { violence: 0.9 } },
        { flagged: true, categories: { sexual: true }, category_scores: { sexual: 0.8 } }
      ]
    });

    const result = await NodeLLM.moderate(["text1", "text2"]);
    expect(result.flagged).toBe(true);
    expect(result.flaggedCategories).toContain("violence");
    expect(result.flaggedCategories).toContain("sexual");
    expect(result.length).toBe(2);
  });

  it("should be iterable", async () => {
    const result = await NodeLLM.moderate("single text");
    const items = [...result];
    expect(items.length).toBe(1);
    expect(items[0].flagged).toBe(false);
  });
});
