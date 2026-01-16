import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    const chat = llm.chat("gpt-4o-mini");

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    const chat = llm.chat("gpt-4o-mini");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });
});
