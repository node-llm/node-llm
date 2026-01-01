import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should stream chat completion with Claude 3 Haiku", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    LLM.configure({ provider: "anthropic" });
    const chat = LLM.chat("claude-3-haiku-20240307");

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
