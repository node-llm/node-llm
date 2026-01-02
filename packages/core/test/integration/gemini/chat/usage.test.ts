import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Usage Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should track total token usage", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    LLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });
    const chat = LLM.chat("gemini-2.0-flash");

    await chat.ask("Hello");
    await chat.ask("How are you?");

    const total = chat.totalUsage;
    expect(total.input_tokens).toBeGreaterThan(0);
    expect(total.output_tokens).toBeGreaterThan(0);
    expect(total.total_tokens).toBe(total.input_tokens + total.output_tokens);
  });
});
