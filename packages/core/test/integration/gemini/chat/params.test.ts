import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Parameters Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should respect max_tokens parameter", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");
    LLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });
    const chat = LLM.chat("gemini-2.0-flash");

    const response = await chat.ask("Write a long poem about the sea.", {
      maxTokens: 5
    });

    expect(response.usage.output_tokens).toBeLessThanOrEqual(10);
    expect(response.content.length).toBeDefined();
  });
});
