import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Image Generation (VCR)", { timeout: 45000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate an image using paint", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });

    // grok-imagine-image does not need any Chat prefix as paint directly accepts the model
    const response = await llm.paint("A beautiful sunset over the mountains, pixel art style", {
      model: "grok-imagine-image"
    });

    expect(response.url).toBeTruthy();
    expect(response.url).toMatch(/^https?:\/\//);
  });
});
