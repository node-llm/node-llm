import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/llm.js";
import { setupVCR } from "../../../helpers/vcr.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

describe("OpenRouter Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openrouter");

    NodeLLM.configure({
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
      provider: "openrouter",
    });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22, condition: "Sunny" });
      }
    };

    const chat = NodeLLM.chat("openai/gpt-4o-mini").withTool(weatherTool);
    const response = await chat.ask("What is the weather in London?");

    expect(String(response)).toContain("22");
    expect(String(response)).toContain("London");
    expect(response.usage?.total_tokens).toBeGreaterThan(0);
  });
});
