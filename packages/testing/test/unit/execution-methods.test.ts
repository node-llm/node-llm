import { describe, it, expect, afterEach, vi } from "vitest";
import { providerRegistry } from "@node-llm/core";
import { Mocker } from "../../src/Mocker.js";
import {
  isExecutionMethod,
  isStreamingExecutionMethod,
  registerExecutionMethod,
  getExecutionMethods,
  resetExecutionMethods
} from "../../src/executionMethods.js";
import { MockProvider } from "../helpers/MockProvider.js";

/**
 * A provider carrying an operation the built-in registry knows nothing about,
 * standing in for a future one (speak, ocr, animate, upload) or a custom
 * provider's own method.
 */
class SpeakingProvider extends MockProvider {
  speak = vi.fn(async (_request: unknown) => ({ audio: "real-network-bytes" })) as any;
}

let providerSeq = 0;

/**
 * Resolves a provider through the registry, which is where the Mocker's
 * interceptor is applied. A fresh name each time because `register` ignores a
 * name it already holds.
 */
function proxied(): any {
  const name = `speaking-provider-${++providerSeq}`;
  providerRegistry.register(name, () => new SpeakingProvider());
  return providerRegistry.resolve(name) as any;
}

afterEach(() => {
  resetExecutionMethods();
  providerRegistry.setInterceptor(undefined);
});

describe("execution method registry", () => {
  it("registers the built-in provider operations", () => {
    for (const method of [
      "chat",
      "stream",
      "paint",
      "transcribe",
      "moderate",
      "embed",
      "judge",
      "listModels"
    ]) {
      expect(isExecutionMethod(method)).toBe(true);
    }
    expect(getExecutionMethods()).toHaveLength(8);
  });

  it("treats only stream as streaming by default", () => {
    expect(isStreamingExecutionMethod("stream")).toBe(true);
    expect(isStreamingExecutionMethod("chat")).toBe(false);
  });

  it("does not recognise an unregistered operation", () => {
    expect(isExecutionMethod("speak")).toBe(false);
  });

  it("registers a new operation, including a streaming one", () => {
    registerExecutionMethod("speak");
    registerExecutionMethod("streamSpeech", { streaming: true });

    expect(isExecutionMethod("speak")).toBe(true);
    expect(isStreamingExecutionMethod("speak")).toBe(false);
    expect(isExecutionMethod("streamSpeech")).toBe(true);
    expect(isStreamingExecutionMethod("streamSpeech")).toBe(true);
  });

  it("accepts several names at once", () => {
    registerExecutionMethod(["ocr", "rerank"]);
    expect(isExecutionMethod("ocr")).toBe(true);
    expect(isExecutionMethod("rerank")).toBe(true);
  });

  it("resets back to the built-ins", () => {
    registerExecutionMethod("speak");
    resetExecutionMethods();
    expect(isExecutionMethod("speak")).toBe(false);
    expect(getExecutionMethods()).toHaveLength(8);
  });
});

describe("Mocker interception follows the registry", () => {
  /**
   * The hazard this registry exists to prevent: an unregistered operation is
   * invisible to the Mocker, so strict mode does not fail and the call reaches
   * the real provider.
   */
  it("lets an unregistered operation escape to the real provider", async () => {
    const mocker = new Mocker({ strict: true });
    const provider = proxied();

    const result = await provider.speak({ text: "hello" });

    expect(result).toEqual({ audio: "real-network-bytes" });
    expect(provider.speak).toHaveBeenCalled();
    expect(mocker.getCalls("speak")).toHaveLength(0);
  });

  it("intercepts the operation once registered", async () => {
    registerExecutionMethod("speak");
    const mocker = new Mocker({ strict: true });
    const provider = proxied();

    await expect(provider.speak({ text: "hello" })).rejects.toThrow(
      "Mocker: Unexpected LLM call to 'speak'"
    );
    expect(mocker.getCalls("speak")).toHaveLength(1);
  });

  it("still intercepts the built-in operations", async () => {
    const mocker = new Mocker({ strict: true });
    const provider = proxied();

    await expect(provider.chat({ messages: [{ role: "user", content: "hi" }] })).rejects.toThrow(
      "Mocker: Unexpected LLM call to 'chat'"
    );
    expect(mocker.getCalls("chat")).toHaveLength(1);
  });
});
