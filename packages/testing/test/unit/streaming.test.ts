import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature 11: Streaming Mocks", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Mocks a streaming response token by token", async () => {
    const chunks = ["Once ", "upon ", "a ", "time."];
    mocker.chat("Tell me a story").stream(chunks);

    const llm = NodeLLM.withProvider("mock-provider");
    const stream = llm.chat("mock-model").stream("Tell me a story");

    const received: string[] = [];
    for await (const chunk of stream) {
      received.push(chunk.content);
    }

    expect(received).toEqual(chunks);
  });

  test("Mocks a streaming response with manual ChatChunk objects", async () => {
    const chunks = [
      { content: "Hello", done: false },
      { content: " world", done: true }
    ];
    mocker.chat("Greeting").stream(chunks);

    const llm = NodeLLM.withProvider("mock-provider");
    const stream = llm.chat("mock-model").stream("Greeting");

    const received: any[] = [];
    for await (const chunk of stream) {
      received.push(chunk);
    }

    expect(received[0].content).toBe("Hello");
    expect(received[1].done).toBe(true);
  });
});
