import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry, Provider } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature: Call History", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider() as unknown as Provider);
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Records chat calls in history", async () => {
    mocker.chat("Hello").respond("Hi");
    mocker.chat("Bye").respond("Goodbye");

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("Hello");
    await llm.chat().ask("Bye");

    expect(mocker.history.length).toBe(2);
    expect(mocker.history[0]!.method).toBe("chat");
    expect((mocker.history[0]!.args[0] as any).messages[0].content).toBe("Hello");
    expect((mocker.history[1]!.args[0] as any).messages[0].content).toBe("Bye");
  });

  test("Records streaming calls in history", async () => {
    mocker.chat("Stream me").stream(["chunk1", "chunk2"]);
    const llm = NodeLLM.withProvider("mock-provider");

    const stream = llm.chat().stream("Stream me");
    for await (const _ of stream) {
      /* consume */
    }

    expect(mocker.history.length).toBe(1);
    expect(mocker.history[0]!.method).toBe("stream");
    expect((mocker.history[0]!.args[0] as any).messages[0].content).toBe("Stream me");
  });

  test("getCalls filters by method", async () => {
    mocker.chat("ChatCall").respond("OK");
    mocker.embed("EmbedCall").respond({ vectors: [[0.1]] });

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("ChatCall");
    await llm.embed("EmbedCall");

    const chatCalls = mocker.getCalls("chat");
    const embedCalls = mocker.getCalls("embed");

    expect(chatCalls.length).toBe(1);
    expect(chatCalls[0]!.method).toBe("chat");

    expect(embedCalls.length).toBe(1);
    expect(embedCalls[0]!.method).toBe("embed");

    expect(mocker.history.length).toBe(2);
  });

  test("getLastCall retrieves the most recent call", async () => {
    mocker.chat("First").respond("1");
    mocker.chat("Second").respond("2");

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("First");
    await llm.chat().ask("Second");

    const last = mocker.getLastCall();
    expect(last).toBeDefined();
    expect((last?.args[0] as any).messages[0].content).toBe("Second");
  });

  test("getLastCall with method filtering checks types", async () => {
    mocker.embed("Embed").respond({ vectors: [[1]] });
    mocker.chat("Chat").respond("Hi");

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.embed("Embed");
    await llm.chat().ask("Chat");

    const lastEmbed = mocker.getLastCall("embed");
    expect(lastEmbed).toBeDefined();
    expect(lastEmbed?.method).toBe("embed");

    const lastChat = mocker.getLastCall("chat");
    expect(lastChat).toBeDefined();
    expect(lastChat?.method).toBe("chat");
  });

  test("resetHistory clears history but preserves mocks", async () => {
    mocker.chat("Preserved").respond("Still here");

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("Preserved");

    expect(mocker.history.length).toBe(1);

    mocker.resetHistory();

    expect(mocker.history.length).toBe(0);

    // Mocks should still work
    const res = await llm.chat().ask("Preserved");
    expect(res.content).toBe("Still here");

    // New history recorded
    expect(mocker.history.length).toBe(1);
  });
});
