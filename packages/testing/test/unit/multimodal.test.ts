import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker Feature: Explicit Multimodal API", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider());
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  test("Uses explicit .paint() mock", async () => {
    mocker.paint(/scary cat/i).respond({ url: "http://mock.com/scary-cat.png" });

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await (llm.provider as any).paint({ prompt: "A very scary cat" });

    expect(res.url).toBe("http://mock.com/scary-cat.png");
  });

  test("Uses explicit .transcribe() mock", async () => {
    mocker.transcribe("audio.mp3").respond("This is the transcript");

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await (llm.provider as any).transcribe({ file: "audio.mp3" });

    expect(res.text).toBe("This is the transcript");
  });

  test("Uses explicit .moderate() mock", async () => {
    mocker.moderate(/hate/i).respond({
      results: [{ flagged: true, categories: { hate: true }, category_scores: { hate: 0.99 } }]
    });

    const llm = NodeLLM.withProvider("mock-provider");
    const res = await (llm.provider as any).moderate({ input: "I hate mushrooms" });

    expect(res.results[0].flagged).toBe(true);
  });
});
