import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

describe("OpenRouter Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");
    LLM.configure({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter",
    });
    // Use a stable model
    const chat = LLM.chat("openai/gpt-4o-mini");

    const response = await chat.ask("What is the capital of Japan?");

    expect(String(response)).toContain("Tokyo");
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    LLM.configure({ provider: "openrouter" });
    const chat = LLM.chat("openai/gpt-4o-mini");

    let fullText = "";
    for await (const chunk of chat.stream("Say 'OpenRouter Stream Test'")) {
      fullText += chunk.content;
    }

    expect(fullText).toContain("OpenRouter Stream Test");
  });
});
