import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("xAI Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available xAI models", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });

    const models = await llm.listModels();

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    // All returned models should be from xAI
    for (const model of models) {
      expect(model.provider).toBe("xai");
    }

    // Grok-3 or similar should be present
    const ids = models.map((m) => m.id);
    const hasGrok = ids.some((id) => id.includes("grok"));
    expect(hasGrok).toBe(true);
  });
});
