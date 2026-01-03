import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Usage Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should return token usage statistics", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    NodeLLM.configure({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic",
    });
    const chat = NodeLLM.chat("claude-3-haiku-20240307");

    const response = await chat.ask("Calculate 2 + 2");

    expect(response.usage).toBeDefined();
    expect(response.usage?.input_tokens).toBeGreaterThan(0);
    expect(response.usage?.output_tokens).toBeGreaterThan(0);
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });
});
