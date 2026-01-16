import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Image Generation Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate images (Paint)", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createLLM({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai"
    });
    const image = await llm.paint("a cute robot", { model: "dall-e-3" });

    expect(String(image)).toContain("https://");
    expect(image.revisedPrompt).toBeDefined();
  });
});
