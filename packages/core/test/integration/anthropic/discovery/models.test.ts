import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Anthropic Models Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list available models", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    NodeLLM.configure({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic",
    });
    const models = await NodeLLM.listModels();

    expect(models).toBeDefined();
    expect(models.length).toBeGreaterThan(0);
    
    // Check for a known Anthropic model
    const sonnet = models.find(m => m.id.includes("sonnet"));
    expect(sonnet).toBeDefined();
    expect(sonnet?.provider).toBe("anthropic");
    expect(sonnet?.context_window).toBeGreaterThan(0);
  });
});
