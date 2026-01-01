import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Parameters Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should respect max_tokens parameter", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    LLM.configure({ provider: "anthropic" });
    const chat = LLM.chat("claude-3-haiku-20240307");

    const response = await chat.ask("Write a long poem about the sea.", {
      maxTokens: 5
    });

    expect(response.usage.output_tokens).toBeLessThanOrEqual(10); // Anthropic can be slightly different
    expect(response.content.length).toBeDefined();
  });
});
