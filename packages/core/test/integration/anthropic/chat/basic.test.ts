import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion with Claude 3 Haiku", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");
    NodeLLM.configure({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic",
    });
    const chat = NodeLLM.chat("claude-3-haiku-20240307");

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    // Anthropic usually returns non-zero tokens usage
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should stream chat completion with Claude 3 Haiku", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    NodeLLM.configure({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic",
    });
    const chat = NodeLLM.chat("claude-3-haiku-20240307");

    let fullResponse = "";
    const stream = chat.stream("What is the capital of France? Answer in one word.");

    for await (const chunk of stream) {
        if (chunk.content) {
            fullResponse += chunk.content;
        }
    }

    expect(fullResponse).toMatch(/Paris/i);
  });
});
