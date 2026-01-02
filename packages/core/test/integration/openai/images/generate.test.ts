import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Image Generation Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate images (Paint)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const image = await LLM.paint("a cute robot", { model: "dall-e-3" });

    expect(String(image)).toContain("https://");
    expect(image.revisedPrompt).toBeDefined();
  });
});
