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
