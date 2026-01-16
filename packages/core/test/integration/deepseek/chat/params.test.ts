import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Params Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support context window param adjustment", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });
    const chat = llm.chat("deepseek-chat");

    // Ask for a very short response but with specific max tokens
    const response = await chat.ask("Say hi", { maxTokens: 5 });
    expect(String(response).length).toBeGreaterThan(0);
  });
});
