import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Embedding Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const response = await LLM.embed("Hello world", { model: "text-embedding-3-small" });

    expect(response.vectors.length).toBe(1);
    expect(response.vector.length).toBeGreaterThan(0);
    expect(response.model).toBe("text-embedding-3-small");
  });

  it("should generate batch embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });
    const response = await LLM.embed(["Hello", "World"], { model: "text-embedding-3-small" });

    expect(response.vectors.length).toBe(2);
    expect(response.vectors[0].length).toBeGreaterThan(0);
    expect(response.vectors[1].length).toBeGreaterThan(0);
  });
});
