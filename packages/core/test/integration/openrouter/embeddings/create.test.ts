import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

describe("OpenRouter Embeddings Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should create embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    LLM.configure({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter",
    });

    const response = await LLM.embed("Hello, world!", {
      model: "text-embedding-3-small", // Common embedding model on OpenRouter
    });

    expect(response.vectors).toBeDefined();
    expect(Array.isArray(response.vectors)).toBe(true);
    expect(response.vectors[0].length).toBeGreaterThan(0);
    expect(response.input_tokens).toBeGreaterThan(0);
  });

  it("should create multiple embeddings", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    LLM.configure({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter",
    });

    const response = await LLM.embed(["Hello", "World"], {
      model: "text-embedding-3-small",
    });

    expect(response.vectors.length).toBe(2);
    expect(response.vectors[0].length).toBeGreaterThan(0);
    expect(response.vectors[1].length).toBeGreaterThan(0);
  });
});
