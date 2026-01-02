import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Multimodal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should throw error for vision inputs", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");

    LLM.configure({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek",
    });
    const chat = LLM.chat("deepseek-chat");

    await expect(chat.ask("What is in this image?", { 
      images: ["https://example.com/image.jpg"] 
    })).rejects.toThrow(/does not support vision/i);
  });
});
