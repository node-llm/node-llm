import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLM, NodeLLMCore } from "../../../src/llm.js";
import { Provider } from "../../../src/providers/Provider.js";

// Mock Provider
const mockEmbed = vi.fn();
const mockSupportsEmbeddings = vi.fn().mockReturnValue(true);

const mockProvider = {
  id: "test",
  defaultModel: () => "test-model",
  embed: mockEmbed,
  capabilities: {
    supportsEmbeddings: mockSupportsEmbeddings
  }
} as unknown as Provider;

describe("NodeLLM Embeddings", () => {
  let llm: NodeLLMCore;

  beforeEach(() => {
    vi.clearAllMocks();
    llm = createLLM({
      provider: mockProvider,
      defaultEmbeddingModel: "text-embedding-3-small"
    });
  });

  it("should call provider.embed with correct arguments", async () => {
    mockEmbed.mockResolvedValue({
      vectors: [[0.1, 0.2]],
      model: "text-embedding-3-small",
      input_tokens: 10,
      dimensions: 2
    });

    const input = "test input";
    const response = await llm.embed(input);

    expect(mockEmbed).toHaveBeenCalledWith({
      input,
      model: "text-embedding-3-small", // Default
      dimensions: undefined,
      requestTimeout: 30000
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
      dimensions: 1
    });

    const input = ["test1", "test2"];
    await llm.embed(input);

    expect(mockEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        input
      })
    );
  });

  it("should allow overriding model and dimensions", async () => {
    mockEmbed.mockResolvedValue({});

    await llm.embed("test", { model: "custom-model", dimensions: 128 });

    expect(mockEmbed).toHaveBeenCalledWith({
      input: "test",
      model: "custom-model",
      dimensions: 128,
      requestTimeout: 30000
    });
  });

  it("should use defaultEmbeddingModel if configured", async () => {
    const customLlm = createLLM({
      provider: mockProvider,
      defaultEmbeddingModel: "configured-default"
    });

    mockEmbed.mockResolvedValue({});
    await customLlm.embed("test");

    expect(mockEmbed).toHaveBeenCalledWith({
      input: "test",
      model: "configured-default",
      dimensions: undefined,
      requestTimeout: 30000
    });
  });

  it("should throw if provider not configured", async () => {
    const unconfigured = createLLM({ provider: undefined });
    await expect(unconfigured.embed("test")).rejects.toThrow("LLM provider not configured");
  });

  it("should throw if provider does not support embed", async () => {
    const limited = createLLM({ provider: {} as unknown as Provider });
    await expect(limited.embed("test")).rejects.toThrow("Provider does not support embed");
  });

  it("should throw if model does not support embeddings", async () => {
    mockSupportsEmbeddings.mockReturnValueOnce(false);
    await expect(llm.embed("test", { model: "chat-model" })).rejects.toThrow(
      "Model chat-model does not support embeddings"
    );
  });
});
