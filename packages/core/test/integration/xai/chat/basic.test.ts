import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion (Generate Text)", async ({ task }) => {
    polly = setupVCR(task.name, "xai");
    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3");

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming (Streaming)", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });
});
