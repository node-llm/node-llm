import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Reasoning Integration (VCR)", { timeout: 60000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should return a response from grok-3-mini (reasoning model)", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    // grok-3-mini is xAI's reasoning model
    const chat = llm.chat("grok-3-mini");

    const response = await chat.ask("What is 2 + 2?");

    expect(String(response)).toContain("4");
    expect(response.total_tokens).toBeGreaterThan(0);
  });
});
