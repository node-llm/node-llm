import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker: Debug Information", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("getDebugInfo returns total mock count", () => {
    mocker.chat("Hello").respond("Hi");
    mocker.chat("Bye").respond("Goodbye");
    mocker.embed("test").respond({ vectors: [[0.1]] });

    const debug = mocker.getDebugInfo();

    expect(debug.totalMocks).toBe(3);
    expect(debug.methods).toContain("chat");
    expect(debug.methods).toContain("embed");
  });

  test("getDebugInfo lists unique methods", () => {
    mocker.chat("First").respond("1");
    mocker.chat("Second").respond("2");
    mocker.chat("Third").respond("3");
    mocker.embed("input").respond({ vectors: [[0.1]] });
    mocker.paint("prompt").respond({ url: "http://test.com/img.png" });

    const debug = mocker.getDebugInfo();

    expect(debug.totalMocks).toBe(5);
    expect(debug.methods).toEqual(expect.arrayContaining(["chat", "embed", "paint"]));
    expect(debug.methods.length).toBe(3); // Unique methods only
  });

  test("getDebugInfo with no mocks", () => {
    const debug = mocker.getDebugInfo();

    expect(debug.totalMocks).toBe(0);
    expect(debug.methods).toEqual([]);
  });

  test("getDebugInfo works with all mock types", () => {
    mocker.chat("test").respond("chat response");
    mocker.embed("test").respond({ vectors: [[0.1]] });
    mocker.paint("test").respond({ url: "http://test.com/img.png" });
    mocker.transcribe("test.mp3").respond("transcript");
    mocker.moderate("test").respond({ results: [] });

    const debug = mocker.getDebugInfo();

    const methods = debug.methods;
    expect(methods).toContain("chat");
    expect(methods).toContain("embed");
    expect(methods).toContain("paint");
    expect(methods).toContain("transcribe");
    expect(methods).toContain("moderate");
    expect(debug.totalMocks).toBe(5);
  });
});
