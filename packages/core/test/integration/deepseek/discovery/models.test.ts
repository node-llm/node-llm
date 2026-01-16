import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Discovery Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should list models", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");

    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });
    const models = await llm.listModels();

    expect(models.length).toBeGreaterThan(0);
    const modelIds = models.map((m) => m.id);
    expect(modelIds).toContain("deepseek-chat");
    expect(modelIds).toContain("deepseek-reasoner");

    const chatModel = models.find((m) => m.id === "deepseek-chat");
    expect(chatModel?.provider).toBe("deepseek");
    expect(chatModel?.context_window).toBe(128000);
  });
});
