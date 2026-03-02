import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Mistral Models Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({
      mistralApiKey: process.env.MISTRAL_API_KEY,
      provider: "mistral"
    });

    const models = await llm.listModels();

    expect(models.length).toBeGreaterThan(0);

    const modelIds = models.map((m) => m.id);
    expect(modelIds.some((id) => id.includes("mistral"))).toBe(true);
  });
});
