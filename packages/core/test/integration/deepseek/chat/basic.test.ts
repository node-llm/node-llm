import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");

    LLM.configure({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek",
    });
    const chat = LLM.chat("deepseek-chat");

    const response = await chat.ask("What is 2 + 2? Answer with just the number.");

    expect(String(response)).toContain("4");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");

    LLM.configure({ provider: "deepseek" });
    const chat = LLM.chat("deepseek-chat");

    let fullText = "";
    for await (const chunk of chat.stream("Count to 3.")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("1");
    expect(fullText).toContain("2");
    expect(fullText).toContain("3");
  });
});
