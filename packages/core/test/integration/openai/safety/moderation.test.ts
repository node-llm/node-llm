import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Safety Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should moderate content", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createLLM({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai"
    });
    const result = await llm.moderate("This is a safe message about coding.");

    expect(result.flagged).toBe(false);
    expect(result.model).toBeDefined();
    expect(result.id).toBeDefined();
  });
});
