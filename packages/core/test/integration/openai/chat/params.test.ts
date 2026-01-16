import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Parameters Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should respect max_tokens parameter", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = createLLM({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai"
    });
    const chat = llm.chat("gpt-4o-mini");

    const response = await chat.ask("Write a long poem about the sea.", {
      maxTokens: 5
    });

    // The output tokens should be <= 5 (or slightly more if provider is fuzzy, but usually exact)
    expect(response.usage.output_tokens).toBeLessThanOrEqual(5);
    // The content should be short
    expect(response.content.split(" ").length).toBeLessThan(10);
  });
});
