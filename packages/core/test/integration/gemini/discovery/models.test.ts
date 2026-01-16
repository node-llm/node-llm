import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");

    const llm = createLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini"
    });
    const models = await llm.listModels();

    expect(models.length).toBeGreaterThan(0);
    const flash = models.find((m) => m.id.includes("flash"));
    expect(flash).toBeDefined();
    expect(flash?.provider).toBe("gemini");
    expect(flash?.capabilities).toContain("streaming");
  });
});
