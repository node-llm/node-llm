import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Mistral Chat Tools Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");
    const llm = createLLM({
      mistralApiKey: process.env.MISTRAL_API_KEY,
      provider: "mistral"
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

    const chat = llm.chat("mistral-large-latest").withTool(weatherTool);

    let toolCalled = false;
    chat.onToolCall(() => {
      toolCalled = true;
    });

    await chat.ask("What is the current weather in Paris? Please use the provided tool to check.");

    expect(toolCalled).toBe(true);
  });

  it("should support multiple tool calls", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");
    const llm = createLLM({ provider: "mistral" });

    const mathTool = {
      type: "function",
      function: {
        name: "calculate",
        description: "Perform a mathematical calculation",
        parameters: {
          type: "object",
          properties: {
            expression: { type: "string", description: "The math expression to evaluate" }
          },
          required: ["expression"]
        }
      },
      handler: async ({ expression }: { expression: string }) => {
        try {
          const result = eval(expression);
          return JSON.stringify({ result });
        } catch {
          return JSON.stringify({ error: "Invalid expression" });
        }
      }
    };

    const chat = llm.chat("mistral-large-latest").withTool(mathTool);

    let toolCallCount = 0;
    chat.onToolCall(() => {
      toolCallCount++;
    });

    await chat.ask("Calculate 5 + 3 and also 10 * 2. Use the calculator tool for each.");

    expect(toolCallCount).toBeGreaterThanOrEqual(1);
  });
});
