import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenRouter Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });
    // Use a stable model
    const chat = llm.chat("openai/gpt-4o-mini");

    const response = await chat.ask("What is the capital of Japan?");

    expect(String(response)).toContain("Tokyo");
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    const llm = createLLM({ provider: "openrouter" });
    const chat = llm.chat("openai/gpt-4o-mini");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'OpenRouter Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("OpenRouter Stream Test");
  });
});
