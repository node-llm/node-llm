import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");
    NodeLLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });
    const chat = NodeLLM.chat("gemini-2.0-flash");

    const response = await chat.ask("What is the capital of Japan?");

    expect(String(response)).toContain("Tokyo");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    NodeLLM.configure({ provider: "gemini" });
    const chat = NodeLLM.chat("gemini-2.0-flash");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("Stream Test");
  });
});
