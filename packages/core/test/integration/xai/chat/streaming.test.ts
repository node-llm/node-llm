import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Streaming Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should stream tokens progressively", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3");

    let chunkCount = 0;
    let fullText = "";

    for await (const chunk of chat.stream("Count from 1 to 3.")) {
      fullText += chunk.content ?? "";
      chunkCount++;
    }

    expect(chunkCount).toBeGreaterThan(0);
    expect(fullText.length).toBeGreaterThan(0);
  });

  it("should accumulate full response across streamed chunks", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'Stream Test' exactly.")) {
      fullText += chunk.content ?? "";
    }

    expect(fullText.toLowerCase()).toContain("stream");
  });
});
