import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Images Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should throw error for image generation", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });
    await expect(llm.paint("test")).rejects.toThrow(/does not support image generation/i);
  });
});
