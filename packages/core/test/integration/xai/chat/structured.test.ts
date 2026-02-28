import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";
import { z } from "zod";

describe("xAI Structured Outputs Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support structured outputs (schema)", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3");

    const format = z.object({
      capital: z.string(),
      population: z.number()
    });

    const response = await chat.withSchema(format).ask("What is the capital of France?");

    const parsed = response.parsed as z.infer<typeof format>;
    expect(parsed.capital).toBe("Paris");
    expect(parsed.population).toBeGreaterThan(0);
  });
});
