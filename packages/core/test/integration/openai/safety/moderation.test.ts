import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Safety Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should moderate content", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    NodeLLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const result = await NodeLLM.moderate("This is a safe message about coding.");

    expect(result.flagged).toBe(false);
    expect(result.model).toBeDefined();
    expect(result.id).toBeDefined();
  });
});
