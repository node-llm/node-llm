import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenRouter Multi-modal Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should analyze images (Vision)", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });
    // Use a vision-capable model
    const chat = llm.chat("google/gemini-2.0-flash-exp:free");

    const response = await chat.ask("What's in this image? Describe what you see.", {
      files: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
      ]
    });

    const content = response.content.toLowerCase();
    expect(content.length).toBeGreaterThan(0);
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });
});
