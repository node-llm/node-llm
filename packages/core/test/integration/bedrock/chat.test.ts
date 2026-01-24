import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM, Tool, z } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import "dotenv/config";

describe("Bedrock integration with Nova (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  const modelId = "amazon.nova-lite-v1:0";

  it("should perform a basic chat completion", async ({ task }) => {
    polly = setupVCR(task.name, "bedrock");
    const llm = NodeLLM.withProvider("bedrock");
    const chat = llm.chat(modelId);

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "bedrock");

    const llm = NodeLLM.withProvider("bedrock");
    const chat = llm.chat(modelId);

    let fullText = "";
    for await (const chunk of chat.stream("Translate 'ocean' to Spanish")) {
      if (chunk.content) {
        fullText += chunk.content;
      }
    }

    expect(fullText.toLowerCase()).toContain("océano");
  });

  it("should support tool calling", async ({ task }) => {
    polly = setupVCR(task.name, "bedrock");

    class WeatherTool extends Tool {
      name = "get_weather";
      description = "Get the current weather for a location";
      schema = z.object({
        location: z.string().describe("City name")
      });

      async execute({ location }: { location: string }) {
        return {
          location,
          temperature: 22,
          unit: "celsius",
          condition: "sunny"
        };
      }
    }

    const llm = NodeLLM.withProvider("bedrock");
    const chat = llm.chat(modelId).withTool(WeatherTool);

    const response = await chat.ask("What's the weather in Paris?");

    expect(response.content.toLowerCase()).toContain("paris");
    expect(response.content.toLowerCase()).toContain("22");
    expect(response.content.toLowerCase()).toContain("sunny");
  });
});
