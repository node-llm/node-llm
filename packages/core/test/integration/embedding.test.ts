import { describe, it, expect, afterEach } from "vitest";
import { setupVCR } from "../helpers/vcr.js";
import { LLM } from "../../src/index.js";

describe("OpenAI Embeddings (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate embeddings for single text", async ({ task }) => {
    polly = setupVCR(task.name);
    LLM.configure({ provider: "openai" });

    const embedding = await LLM.embed("Hello world");

    expect(embedding.vectors).toHaveLength(1);
    expect(embedding.vector).toHaveLength(1536); // Default for text-embedding-3-small
    expect(embedding.model).toBe("text-embedding-3-small");
    expect(embedding.input_tokens).toBeGreaterThan(0);
  });

  it("should generate embeddings for multiple texts", async ({ task }) => {
    polly = setupVCR(task.name);
    LLM.configure({ provider: "openai" });

    const input = ["Hello", "World"];
    const embedding = await LLM.embed(input);

    expect(embedding.vectors).toHaveLength(2);
    expect(embedding.vectors[0]).toHaveLength(1536);
    expect(embedding.vectors[1]).toHaveLength(1536);
  });

  it("should support custom dimensions", async ({ task }) => {
    polly = setupVCR(task.name);
    LLM.configure({ provider: "openai" });

    const embedding = await LLM.embed("Hello world", { dimensions: 256 });

    expect(embedding.vector).toHaveLength(256);
  });

  it("should use configured default model", async ({ task }) => {
    polly = setupVCR(task.name);
    LLM.configure({ 
      provider: "openai",
      defaultEmbeddingModel: "text-embedding-3-large"
    });

    const embedding = await LLM.embed("Hello world");

    expect(embedding.model).toBe("text-embedding-3-large");
    expect(embedding.vector).toHaveLength(3072); // Default for large
  });

  it("should throw error for non-embedding model", async ({ task }) => {
    polly = setupVCR(task.name);
    LLM.configure({ provider: "openai" });

    await expect(LLM.embed("Hello", { model: "gpt-4" }))
      .rejects.toThrow("Model gpt-4 does not support embeddings");
  });
});
