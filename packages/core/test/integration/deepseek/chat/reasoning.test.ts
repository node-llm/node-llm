import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Reasoning Integration (VCR)", { timeout: 60000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should capture reasoning content for deepseek-reasoner", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });
    const chat = llm.chat("deepseek-reasoner");

    const response = await chat.ask("Calculate 123 * 456 and explain the steps.");

    expect(typeof response.reasoning).toBe("string");
    expect(response.reasoning!.length).toBeGreaterThan(0);
    expect(typeof response.content).toBe("string");
  });

  it("should stream reasoning content for deepseek-reasoner", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({ provider: "deepseek" });
    const chat = llm.chat("deepseek-reasoner");

    let hasReasoning = false;
    let hasContent = false;

    for await (const chunk of chat.stream("What is the capital of France?")) {
      if (chunk.reasoning) hasReasoning = true;
      if (chunk.content) hasContent = true;
    }

    expect(hasReasoning).toBe(true);
    expect(hasContent).toBe(true);
  });
});
