import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createLLM, NodeLLMCore } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import { Polly } from "@pollyjs/core";
import "dotenv/config";

describe("Bedrock Image Generation Integration (VCR)", { timeout: 60000 }, () => {
  let polly: Polly;
  let llm: NodeLLMCore;

  beforeEach(({ task }) => {
    polly = setupVCR(task.name, "bedrock");

    llm = createLLM({
      provider: "bedrock",
      bedrockRegion: process.env.AWS_REGION || "us-east-1"
    });
  });

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate an image using Amazon Titan", async () => {
    const response = await llm.paint("A simple cat sitting on a mat", {
      model: "amazon.titan-image-generator-v2:0"
    });

    expect(response.data).toBeDefined();
    expect(response.mimeType).toBe("image/png");
  });

  it("should support size parameters", async () => {
    const response = await llm.paint("A small blue square", {
      model: "amazon.titan-image-generator-v2:0",
      size: "512x512"
    });

    expect(response.data).toBeDefined();
  });
});
