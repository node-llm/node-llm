import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Chat Integration Prediction (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should process a chat with predicted outputs to lower latency", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = NodeLLM.withProvider("openai", {
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    // Only gpt-4o or gpt-4o-mini support this right now
    const chat = llm.chat("gpt-4o-mini").withPrediction("function foo() { return true; }");

    const response = await chat.ask(
      "Rewrite this function to return false:\n\nfunction foo() { return true; }"
    );

    expect(String(response)).toContain("return false");
    expect(response.usage).toBeDefined();
  });
});
