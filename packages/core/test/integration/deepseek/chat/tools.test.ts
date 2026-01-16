import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Tools Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });

    const weatherTool = {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "The city and state, e.g. San Francisco, CA" }
          },
          required: ["location"]
        }
      },
      handler: async ({ location }: { location: string }) => {
        return JSON.stringify({ location, temperature: 22, unit: "celsius" });
      }
    };

    const chat = llm.chat("deepseek-chat").withTool(weatherTool);

    // Track tool calls
    let toolCalled = false;
    chat.onToolCall(() => {
      toolCalled = true;
    });

    await chat.ask("What is the current weather in Paris? Please use the provided tool to check.");

    expect(toolCalled).toBe(true);
  });
});
