import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI JSON Mode Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support JSON mode", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const chat = LLM.chat("gpt-4o-mini");

    chat.withRequestOptions({
       headers: { "Content-Type": "application/json" }
    });

    // Manually setting response_format via chat options interface we just added
    chat["options"].responseFormat = { type: "json_object" };

    const response = await chat.ask("Generate a JSON object with a key 'greeting' and value 'hello'.");
    
    // Should be parseable JSON
    // We can now use the .parsed property directly
    const json = response.parsed;
    expect(json).toBeDefined();
    expect(json.greeting).toBe("hello");
  });
});
