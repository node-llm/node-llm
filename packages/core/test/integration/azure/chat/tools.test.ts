import { describe, it, expect, afterEach } from "vitest";
import { z } from "zod";
import { defineTool } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import { azure, DEPLOYMENT } from "../helpers.js";
import "dotenv/config";

describe("Azure Chat Tools Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  const weather = defineTool({
    name: "get_weather",
    description: "Get the current weather in a city",
    schema: z.object({ city: z.string() }),
    execute: async ({ city }) => `It is 21C and sunny in ${city}.`
  });

  it("should call a tool and use its result", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const chat = azure().chat(DEPLOYMENT).withTool(weather);
    const called: string[] = [];
    chat.onToolCall((call) => {
      called.push(call.function.name);
    });

    const response = await chat.ask("What is the weather in Kochi? Use the tool.");

    expect(called).toContain("get_weather");
    expect(String(response)).toMatch(/21|sunny/i);
  });

  it("should support multiple tool calls", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure()
      .chat(DEPLOYMENT)
      .withTool(weather)
      .ask("What is the weather in Oslo and in Lisbon? Use the tool for each city.");

    expect(String(response)).toMatch(/oslo/i);
    expect(String(response)).toMatch(/lisbon/i);
  });
});
