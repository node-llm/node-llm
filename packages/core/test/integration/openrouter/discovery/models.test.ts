import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenRouter Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });

    const models = await llm.listModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    // Check for a few well-known models that should be on OpenRouter
    const modelIds = models.map((m) => m.id);
    expect(
      modelIds.some((id) => id.includes("gpt") || id.includes("claude") || id.includes("gemini"))
    ).toBe(true);
  });
});
