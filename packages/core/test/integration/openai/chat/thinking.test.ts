import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Thinking Integration (VCR)", { timeout: 60000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support extended thinking with o3-mini", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    // o3-mini supports reasoning_effort (mapped from thinking.effort)
    const chat = llm.chat("o3-mini").withEffort("medium");

    const response = await chat.ask("Calculate the 10th Fibonacci number and explain your steps.");

    expect(String(response)).toContain("55");
    expect(response.thinking).toBeDefined();
    // OpenAI o-series models return reasoning_tokens even if reasoning_content is not visible in some cases,
    // but o3-mini should have reasoning_tokens in usage.
    expect(response.thinking?.tokens).toBeGreaterThan(0);
  });

  it("should support streaming with thinking", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const chat = llm.chat("o3-mini").withEffort("low");

    let fullText = "";

    for await (const chunk of chat.stream("What is 123 * 456?")) {
      if (chunk.content) fullText += chunk.content;
    }

    // LLM may format the number with commas
    expect(fullText.replace(/,/g, "")).toContain("56088");

    // Verify message was captured in history
    const lastMsg = chat.history[chat.history.length - 1]!;
    expect(lastMsg.role).toBe("assistant");
  });
});
