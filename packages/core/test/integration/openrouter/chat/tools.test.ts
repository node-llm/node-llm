import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/llm.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenRouter Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    const llm = createLLM({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter"
    });

    const weatherTool = {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get weather",
        parameters: { type: "object", properties: { location: { type: "string" } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22, condition: "Sunny" });
      }
    };

    const chat = llm.chat("openai/gpt-4o-mini").withTool(weatherTool);
    const response = await chat.ask("What is the weather in London?");

    expect(String(response)).toContain("22");
    expect(String(response)).toContain("London");
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });
});
