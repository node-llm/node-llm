import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Vision Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should understand image inputs (Image Understanding)", async ({ task }) => {
    polly = setupVCR(task.name, "xai");
    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });

    // Using grok-2-vision if it exists, otherwise grok-2
    const chat = llm.chat("grok-2-vision-1212");

    const response = await chat.ask([
      { type: "text", text: "What colors are in this image?" },
      {
        type: "image_url",
        image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Color-blue.JPG" }
      }
    ]);

    expect(String(response).toLowerCase()).toContain("blue");
  });
});
