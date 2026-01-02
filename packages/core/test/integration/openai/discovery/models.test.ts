import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const models = await LLM.listModels();

    expect(models.length).toBeGreaterThan(0);
    const gpt4 = models.find(m => m.id.includes("gpt-4"));
    expect(gpt4).toBeDefined();
    expect(gpt4?.provider).toBe("openai");
  });
});
