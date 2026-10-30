import { describe, it, expect, afterEach } from "vitest";
import { createLLM, CostLimitError, defineTool, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";

const weather = defineTool({
  name: "get_weather",
  description: "Get the current weather in a city",
  schema: z.object({ city: z.string() }),
  execute: async ({ city }) => `It is 21C and sunny in ${city}.`
});

describe("OpenAI GPT-5.6 tools through the Responses API", () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    await polly?.stop();
  });

  it("calls a tool and answers with its result", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createLLM({ provider: "openai" });

    const answer = await llm
      .chat("gpt-5.6-luna")
      .withTool(weather)
      .ask("What is the weather in Kochi? Use the tool.");

    expect(String(answer)).toMatch(/21|sunny/i);
    expect(answer.usage.input_tokens).toBeGreaterThan(0);
  });

  it("stops at maxCost before running the tool loop further", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-5.6-luna", { maxCost: 0 }).withTool(weather);

    await expect(chat.ask("What is the weather in Kochi? Use the tool.")).rejects.toBeInstanceOf(
      CostLimitError
    );
    expect(chat.history.at(-1)).toMatchObject({
      role: "tool",
      content: "Not run: the cost limit ($0) was reached."
    });
  });
});
