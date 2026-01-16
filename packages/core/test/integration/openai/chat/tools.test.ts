import { describe, it, expect, afterEach } from "vitest";
import { createLLM, Tool, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Tool Calling Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should handle tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = createLLM({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai"
    });

    class WeatherTool extends Tool {
      name = "get_weather";
      description = "Get weather";
      schema = z.object({ location: z.string() });
      async execute({ location }: { location: string }) {
        return { location, temperature: 22, condition: "Sunny" };
      }
    }

    const chat = llm.chat("gpt-4o-mini").withTool(WeatherTool);
    const response = await chat.ask("What is the weather in London?");

    expect(String(response)).toContain("22");
    expect(String(response)).toContain("London");
    expect(response.usage.input_tokens).toBeGreaterThan(0);
  });

  it("should handle parallel tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "openai");

    const llm = createLLM({ provider: "openai" });

    class WeatherTool extends Tool {
      name = "get_weather";
      description = "Get weather";
      schema = z.object({ location: z.string() });
      async execute({ location }: { location: string }) {
        return { location, temperature: 22 };
      }
    }

    const chat = llm.chat("gpt-4o-mini").withTool(WeatherTool);
    // Requesting weather for multiple locations triggers parallel calls
    const response = await chat.ask("What is the weather in Paris and London?");

    const Paris = String(response).includes("Paris");
    const London = String(response).includes("London");
    // Expect both locations to be mentioned in the final response
    expect(Paris && London).toBe(true);
    // Verify that tool calls happened (we can inspect history for more granular checks if needed)
    const toolCalls = chat.history.filter((m) => m.role === "tool");
    expect(toolCalls.length).toBeGreaterThanOrEqual(2);
  });
});
