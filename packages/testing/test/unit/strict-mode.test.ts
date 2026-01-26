import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature: Strict Mode", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Allows unmatched requests in non-strict mode (default)", async () => {
    mocker.chat("Hello").respond("Hi");

    const llm = NodeLLM.withProvider("mock-provider");

    // This should not throw because strict mode is off
    const res = await llm.chat().ask("Goodbye");
    expect(res.content).toBeDefined();
  });

  test("Throws error on unmatched chat request in strict mode", async () => {
    mocker.strict = true;
    mocker.chat("Hello").respond("Hi");

    const llm = NodeLLM.withProvider("mock-provider");

    // This should throw because strict mode is on and no mock matches
    await expect(llm.chat().ask("Goodbye")).rejects.toThrow(/strict|no mock|unexpected/i);
  });

  test("Allows matching requests in strict mode", async () => {
    mocker.strict = true;
    mocker.chat("Hello").respond("Hi");

    const llm = NodeLLM.withProvider("mock-provider");

    // This should succeed because the mock matches
    const res = await llm.chat().ask("Hello");
    expect(res.content).toBe("Hi");
  });

  test("Throws error on unmatched embed request in strict mode", async () => {
    mocker.strict = true;
    mocker.embed("text1").respond({ vectors: [[0.1, 0.2]] });

    const llm = NodeLLM.withProvider("mock-provider");

    // This should throw
    await expect((llm.provider as any).embed({ input: "text2" })).rejects.toThrow(
      /strict|no mock|unexpected/i
    );
  });

  test("Throws error on unmatched paint request in strict mode", async () => {
    mocker.strict = true;
    mocker.paint("dog").respond({ url: "http://mock.com/dog.png" });

    const llm = NodeLLM.withProvider("mock-provider");

    // This should throw
    await expect((llm.provider as any).paint({ prompt: "cat" })).rejects.toThrow(
      /strict|no mock|unexpected/i
    );
  });

  test("Throws error on unmatched streaming request in strict mode", async () => {
    mocker.strict = true;
    mocker.chat("Tell me a story").stream(["Once ", "upon ", "a ", "time."]);

    const llm = NodeLLM.withProvider("mock-provider");

    // This should throw because no mock matches "Different story"
    const stream = llm.chat("mock-model").stream("Different story");

    let threwError = false;
    try {
      for await (const chunk of stream) {
        // consume stream
      }
    } catch (e) {
      threwError = true;
      expect(String(e)).toMatch(/strict|no mock|unexpected/i);
    }

    expect(threwError).toBe(true);
  });

  test("Can toggle strict mode on and off", async () => {
    mocker.chat("Hello").respond("Hi");
    const llm = NodeLLM.withProvider("mock-provider");

    // First: non-strict (default)
    const res1 = await llm.chat().ask("Goodbye");
    expect(res1.content).toBeDefined();

    // Toggle to strict
    mocker.strict = true;
    await expect(llm.chat().ask("Goodbye")).rejects.toThrow(/strict|no mock|unexpected/i);

    // Toggle back to non-strict
    mocker.strict = false;
    const res2 = await llm.chat().ask("Goodbye");
    expect(res2.content).toBeDefined();
  });
});
