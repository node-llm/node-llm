import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM, Tool } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import { z } from "zod";
import "dotenv/config";

// Define a test tool
// Define a test tool
const WeatherTool: Tool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"]
        }
      },
      required: ["location"]
    }
  },
  handler: async ({ location, unit }: { location: string; unit?: string }) => {
    return JSON.stringify({
      location,
      temperature: 22,
      unit: unit || "celsius",
      conditions: "Sunny",
    });
  }
};

describe("Anthropic Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "anthropic");

    NodeLLM.configure({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic",
    });
    const chat = NodeLLM.chat("claude-3-haiku-20240307")
        .withTool(WeatherTool);

    const response = await chat.ask("What is the weather in Paris?");

    expect(response.content).toBeDefined();
    // The response content tells us the weather, implying the tool was called and the result was fed back.
    expect(response.content).toContain("Paris");
    expect(response.content).toMatch(/sunny/i);
    expect(response.content).toContain("22");
  });
});
