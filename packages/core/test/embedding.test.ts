import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLM } from "../src/llm.js";
import { EmbeddingRequest, EmbeddingResponse } from "../src/providers/Embedding.js";

// Mock Provider
const mockEmbed = vi.fn();
const mockSupportsEmbeddings = vi.fn().mockReturnValue(true);

const mockProvider = {
  embed: mockEmbed,
  capabilities: {
    supportsEmbeddings: mockSupportsEmbeddings,
  },
};

describe("LLM Embeddings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LLM.configure({ 
      provider: mockProvider as any,
      defaultEmbeddingModel: "text-embedding-3-small"
    });
  });

  it("should call provider.embed with correct arguments", async () => {
    mockEmbed.mockResolvedValue({
      vectors: [[0.1, 0.2]],
      model: "text-embedding-3-small",
      input_tokens: 10,
      dimensions: 2,
    });

    const input = "test input";
    const response = await LLM.embed(input);

    expect(mockEmbed).toHaveBeenCalledWith({
      input,
      model: "text-embedding-3-small", // Default
      dimensions: undefined,
    });

    expect(response.vectors).toEqual([[0.1, 0.2]]);
    expect(response.input_tokens).toBe(10);
    expect(response.dimensions).toBe(2);
    expect(response.model).toBe("text-embedding-3-small");
  });

  it("should support batch input", async () => {
    mockEmbed.mockResolvedValue({
      vectors: [[0.1], [0.2]],
      model: "text-embedding-3-small",
      input_tokens: 20,
      dimensions: 1,
    });

    const input = ["test1", "test2"];
    await LLM.embed(input);

    expect(mockEmbed).toHaveBeenCalledWith(expect.objectContaining({
      input,
    }));
  });

  it("should allow overriding model and dimensions", async () => {
    mockEmbed.mockResolvedValue({});

    await LLM.embed("test", { model: "custom-model", dimensions: 128 });

    expect(mockEmbed).toHaveBeenCalledWith({
      input: "test",
      model: "custom-model",
      dimensions: 128,
    });
  });

  it("should use defaultEmbeddingModel if configured", async () => {
    LLM.configure({
      provider: mockProvider as any,
      defaultEmbeddingModel: "configured-default",
    });

    mockEmbed.mockResolvedValue({});
    await LLM.embed("test");

    expect(mockEmbed).toHaveBeenCalledWith({
      input: "test",
      model: "configured-default",
      dimensions: undefined,
    });
  });

  it("should throw if provider not configured", async () => {
    // @ts-ignore - hacking private property for test
    LLM["provider"] = undefined;
    await expect(LLM.embed("test")).rejects.toThrow("LLM provider not configured");
  });

  it("should throw if provider does not support embed", async () => {
    LLM.configure({ provider: {} as any });
    await expect(LLM.embed("test")).rejects.toThrow("Provider does not support embed");
  });

  it("should throw if model does not support embeddings", async () => {
    mockSupportsEmbeddings.mockReturnValueOnce(false);
    await expect(LLM.embed("test", { model: "chat-model" }))
      .rejects.toThrow("Model chat-model does not support embeddings");
  });
});
