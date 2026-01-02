import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Usage Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should track token usage", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    LLM.configure({ provider: "deepseek" });
    const chat = LLM.chat("deepseek-chat");

    const response = await chat.ask("Hello");

    expect(response.usage).toBeDefined();
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.output_tokens).toBeGreaterThan(0);
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  });
});
