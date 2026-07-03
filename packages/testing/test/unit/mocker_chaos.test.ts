import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker: thinking/reasoning/metadata, throws(), and tool call content", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  it("passes thinking, reasoning, and metadata through the MockResponse", async () => {
    mocker.chat(/prove/).respond({
      content: "The proof is trivial.",
      thinking: { text: "Let's think step-by-step...", tokens: 42 },
      reasoning: "step-by-step reasoning",
      metadata: { cache_status: "HIT" }
    });

    const res = await NodeLLM.withProvider("mock-provider").chat().ask("Please prove P=NP.");

    expect(res.content).toBe("The proof is trivial.");
    expect(res.thinking?.text).toBe("Let's think step-by-step...");
    expect(res.thinking?.tokens).toBe(42);
    expect(res.reasoning).toBe("step-by-step reasoning");
    expect(res.meta.metadata?.cache_status).toBe("HIT");
  });

  it("handles chaos engineering via .throws()", async () => {
    mocker.chat(/crash/).throws("429 Too Many Requests");

    await expect(
      NodeLLM.withProvider("mock-provider").chat().ask("crash the system")
    ).rejects.toThrow("429 Too Many Requests");
  });

  it("accepts an Error instance in .throws()", async () => {
    mocker.chat(/crash/).throws(new Error("custom failure"));

    await expect(
      NodeLLM.withProvider("mock-provider").chat().ask("crash the system")
    ).rejects.toThrow("custom failure");
  });

  it("supports simultaneous tool call AND conversational content via callsTool()", async () => {
    mocker
      .chat(/weather/)
      .callsTool("get_weather", { location: "London" }, "Let me check that for you!");

    const res = await NodeLLM.withProvider("mock-provider")
      .chat("mock-model", { toolExecution: "dry-run" as any })
      .ask("What is the weather in London?");

    expect(res.content).toBe("Let me check that for you!");
    const toolCall = res.tool_calls?.[0];
    expect(toolCall).toBeDefined();
    expect(toolCall?.function.name).toBe("get_weather");
    expect(JSON.parse(toolCall?.function.arguments ?? "{}")).toEqual({ location: "London" });
  });

  it("supports simultaneous tool calls AND conversational content via callsTools()", async () => {
    mocker.chat(/book flight/).callsTools(
      [
        { name: "search_flights", args: { from: "NYC", to: "LAX" } },
        { name: "check_weather", args: { city: "LAX" } }
      ],
      "Checking flights and weather now!"
    );

    const res = await NodeLLM.withProvider("mock-provider")
      .chat("mock-model", { toolExecution: "dry-run" as any })
      .ask("book flight from NYC to LAX");

    expect(res.content).toBe("Checking flights and weather now!");
    expect(res.tool_calls).toHaveLength(2);
    expect(res.tool_calls?.[0]?.function.name).toBe("search_flights");
    expect(res.tool_calls?.[1]?.function.name).toBe("check_weather");
  });
});
