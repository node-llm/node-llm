import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createLLM({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai"
    });
    const models = await llm.listModels();

    expect(models.length).toBeGreaterThan(0);
    const gpt4 = models.find((m) => m.id.includes("gpt-4"));
    expect(gpt4).toBeDefined();
    expect(gpt4?.provider).toBe("openai");
  });
});
