import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Mistral Embeddings Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate embeddings for text", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({
      mistralApiKey: process.env.MISTRAL_API_KEY,
      provider: "mistral"
    });

    const result = await llm.embed("Hello world", { model: "mistral-embed" });

    expect(result.vectors).toBeDefined();
    expect(result.vectors.length).toBe(1);
    expect(result.vectors[0].length).toBeGreaterThan(0);
    expect(result.model).toBe("mistral-embed");
    expect(result.input_tokens).toBeGreaterThan(0);
  });

  it("should generate embeddings for multiple texts", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({ provider: "mistral" });

    const result = await llm.embed(["Hello", "World", "Test"], { model: "mistral-embed" });

    expect(result.vectors).toBeDefined();
    expect(result.vectors.length).toBe(3);
    result.vectors.forEach((vec) => {
      expect(vec.length).toBeGreaterThan(0);
    });
  });
});
