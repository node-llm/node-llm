import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Mistral Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({
      mistralApiKey: process.env.MISTRAL_API_KEY,
      provider: "mistral"
    });
    const chat = llm.chat("mistral-large-latest");

    const response = await chat.ask("What is 2 + 2? Answer with just the number.");

    expect(String(response)).toContain("4");
    expect(response.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({ provider: "mistral" });
    const chat = llm.chat("mistral-large-latest");

    let fullText = "";
    for await (const chunk of chat.stream("Count to 3.")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("1");
    expect(fullText).toContain("2");
    expect(fullText).toContain("3");
  });

  it("should support system messages", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({ provider: "mistral" });
    const chat = llm
      .chat("mistral-large-latest")
      .system("You are a pirate. Always respond as a pirate would.");

    const response = await chat.ask("Hello!");

    // Just verify we get a response - content varies
    expect(response.content || String(response)).toBeTruthy();
  });
});
