import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Gemini Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "gemini");
    NodeLLM.configure({
      geminiApiKey: process.env.GEMINI_API_KEY,
      provider: "gemini",
    });

    const weatherTool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather',
        parameters: { type: 'object', properties: { location: { type: 'string' } } }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 18, condition: "Cloudy" });
      }
    };

    const chat = NodeLLM.chat("gemini-2.0-flash").withTool(weatherTool);
    const response = await chat.ask("What is the weather in Berlin?");

    expect(String(response)).toContain("18");
    expect(String(response)).toContain("Berlin");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });
});
