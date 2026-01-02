import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
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

    const chat = LLM.chat("gpt-4o-mini").withTool(weatherTool);
    const response = await chat.ask("What is the weather in London?");

    expect(String(response)).toContain("22");
    expect(String(response)).toContain("London");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should handle parallel tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    LLM.configure({ provider: "openai" });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22 });
      }
    };

    const chat = LLM.chat("gpt-4o-mini").withTool(weatherTool);
    // Requesting weather for multiple locations triggers parallel calls
    const response = await chat.ask("What is the weather in Paris and London?");

    const Paris = String(response).includes("Paris");
    const London = String(response).includes("London");
    // Expect both locations to be mentioned in the final response
    expect(Paris && London).toBe(true);
    // Verify that tool calls happened (we can inspect history for more granular checks if needed)
    const toolCalls = chat.history.filter(m => m.role === "tool");
    expect(toolCalls.length).toBeGreaterThanOrEqual(2);
  });
});
