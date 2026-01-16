import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenRouter Embeddings Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should create embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });

    const response = await llm.embed("Hello, world!", {
      model: "text-embedding-3-small" // Common embedding model on OpenRouter
    });

    expect(response.vectors).toBeDefined();
    expect(Array.isArray(response.vectors)).toBe(true);
    expect(response.vectors!.length).toBeGreaterThan(0);
    expect(response.vectors![0]!.length).toBeGreaterThan(0);
    expect(response.input_tokens).toBeGreaterThan(0);
  });

  it("should create multiple embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });

    const response = await llm.embed(["Hello", "World"], {
      model: "text-embedding-3-small"
    });

    expect(response.vectors!.length).toBe(2);
    expect(response.vectors![0]!.length).toBeGreaterThan(0);
    expect(response.vectors![1]!.length).toBeGreaterThan(0);
  });
});
