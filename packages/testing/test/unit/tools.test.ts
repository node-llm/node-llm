import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature: Tool Call Support", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Mocks an LLM requesting a tool", async () => {
    mocker.chat("What is the weather?").callsTool("get_weather", { city: "London" });

    const llm = NodeLLM.withProvider("mock-provider");
    // Correct signature: chat(model, options)
    const res = await llm
      .chat("mock-model", { toolExecution: "dry-run" as any })
      .ask("What is the weather?");

    expect(res.tool_calls).toBeDefined();
    expect(res.tool_calls?.[0]?.function?.name).toBe("get_weather");
  });

  test("Mocks the response after a tool result", async () => {
    mocker.chat("What is the weather?").callsTool("get_weather", { city: "London" });
    mocker.placeholder("sunny").respond("It is a beautiful sunny day in London!");

    const llm = NodeLLM.withProvider("mock-provider");
    const res1 = await llm
      .chat("mock-model", { toolExecution: "dry-run" as any })
      .ask("What is the weather?");

    expect(res1.tool_calls).toBeDefined();
    const toolCall = res1.tool_calls![0];

    const chat = llm
      .chat("mock-model")
      .add("user", "What is the weather?")
      .addMessage({ role: "assistant", content: null, tool_calls: res1.tool_calls })
      .addMessage({
        role: "tool",
        tool_call_id: toolCall.id,
        content: "sunny",
        name: toolCall.function.name
      });

    const res2 = await chat.ask("Any more?");

    expect(res2.content).toBe("It is a beautiful sunny day in London!");
  });
});
