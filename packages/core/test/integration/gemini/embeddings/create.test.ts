import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Embedding Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    const llm = createLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini"
    });
    const response = await llm.embed("Hello world", { model: "text-embedding-004" });

    expect(response.vectors.length).toBe(1);
    expect(response.vector.length).toBeGreaterThan(0);
    expect(response.model).toBe("text-embedding-004");
  });

  it("should generate batch embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    const llm = createLLM({ provider: "gemini" });
    const response = await llm.embed(["Hello", "World"], { model: "text-embedding-004" });

    expect(response.vectors.length).toBe(2);
    expect(response.vectors[0].length).toBeGreaterThan(0);
    expect(response.vectors[1].length).toBeGreaterThan(0);
  });
});
