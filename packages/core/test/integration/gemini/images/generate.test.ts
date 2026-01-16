import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Image Generation Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should generate an image and support image features (Paint)", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    const llm = createLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini"
    });
    const image = await llm.paint("A sunset over the mountains", {
      model: "imagen-4.0-generate-001"
    });

    expect(image.data).toBeDefined();
    expect(image.mimeType).toBe("image/png");
    expect(image.isBase64).toBe(true);

    const buffer = await image.toBuffer();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
