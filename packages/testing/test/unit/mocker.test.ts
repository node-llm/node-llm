import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature 10: Declarative Mocks", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    // Register a real provider to verify pass-through vs mock
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Mocks exact chat queries", async () => {
    mocker.chat("Ping").respond("Pong");

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await llm.chat().ask("Ping");

    expect(res.content).toBe("Pong");
  });

  test("Mocks using Regex patterns", async () => {
    mocker.chat(/hello/i).respond("Greetings!");

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await llm.chat().ask("HHeelllooo"); // Should fail
    const res2 = await llm.chat().ask("Hello there");

    expect(res2.content).toBe("Greetings!");
  });

  test("Simulates Provider Errors", async () => {
    mocker.chat("Fail me").respond({
      error: new Error("Rate limit exceeded")
    });

    const llm = NodeLLM.withProvider("mock-provider");
    await expect(llm.chat().ask("Fail me")).rejects.toThrow("Rate limit exceeded");
  });
});

describe("Mocker: Multi-tool and Sequence Support", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("callsTools() mocks multiple tool calls in one response", async () => {
    mocker.chat(/book/i).callsTools([
      { name: "search_flights", args: { from: "NYC", to: "LAX" } },
      { name: "check_weather", args: { city: "LAX" } }
    ]);

    const llm = NodeLLM.withProvider("mock-provider");
    // Use dry-run to get raw response without tool execution
    const res = await llm
      .chat("mock-model", { toolExecution: "dry-run" as any })
      .ask("Book a flight to LA");

    expect(res.tool_calls).toHaveLength(2);
    expect(res.tool_calls[0].function.name).toBe("search_flights");
    expect(res.tool_calls[1].function.name).toBe("check_weather");
  });

  test("sequence() returns different responses on consecutive calls", async () => {
    mocker
      .chat(/help/i)
      .sequence(["What do you need help with?", "Here's the answer.", "Anything else?"]);

    const llm = NodeLLM.withProvider("mock-provider");

    const res1 = await llm.chat().ask("Help me");
    const res2 = await llm.chat().ask("Help me again");
    const res3 = await llm.chat().ask("Help me more");
    const res4 = await llm.chat().ask("Help me once more"); // Should repeat last

    expect(res1.content).toBe("What do you need help with?");
    expect(res2.content).toBe("Here's the answer.");
    expect(res3.content).toBe("Anything else?");
    expect(res4.content).toBe("Anything else?"); // Repeats last
  });

  test("times() limits how many times a mock matches", async () => {
    mocker.chat(/retry/i).times(2).respond("Try again");
    mocker.chat(/retry/i).respond("Giving up");

    const llm = NodeLLM.withProvider("mock-provider");

    const res1 = await llm.chat().ask("Please retry");
    const res2 = await llm.chat().ask("Please retry");
    const res3 = await llm.chat().ask("Please retry");

    expect(res1.content).toBe("Try again");
    expect(res2.content).toBe("Try again");
    expect(res3.content).toBe("Giving up");
  });
});
