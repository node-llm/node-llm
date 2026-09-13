import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Multi-modal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    const llm = createLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini"
    });
    const chat = llm.chat("gemini-2.0-flash");

    // A small 1x1 red PNG dot
    const base64Image =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const response = await chat.ask("What color is this image?", {
      images: [base64Image]
    });

    expect(String(response).toLowerCase()).toContain("red");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should reject transcription for models without audio support", async () => {
    const llm = createLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini"
    });

    await expect(
      llm.transcribe("unused-audio-path", { model: "gemini-2.0-flash" })
    ).rejects.toThrow("does not support transcription");
  });
});
