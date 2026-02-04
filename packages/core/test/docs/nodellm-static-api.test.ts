/**
 * NodeLLM Static API Verification
 *
 * Verifies that all static methods documented on the NodeLLM class exist.
 */
import { describe, it, expect } from "vitest";
import { NodeLLM, providerRegistry, createLLM } from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

// Register fake provider
providerRegistry.register("fake", () => new FakeProvider(["test"]));

describe("nodellm-static-api", () => {
  describe("Core Chat Methods", () => {
    it("has chat() static method", () => {
      expect(typeof NodeLLM.chat).toBe("function");
    });

    it("chat() via createLLM returns a Chat instance", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat();
      expect(chat).toBeDefined();
      expect(typeof chat.ask).toBe("function");
      expect(typeof chat.stream).toBe("function");
    });

    it("chat() accepts model parameter", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model");
      expect(chat).toBeDefined();
    });
  });

  describe("Provider Methods", () => {
    it("has withProvider() static method", () => {
      expect(typeof NodeLLM.withProvider).toBe("function");
    });
  });

  describe("Image Generation", () => {
    it("has paint() static method", () => {
      expect(typeof NodeLLM.paint).toBe("function");
    });
  });

  describe("Audio Transcription", () => {
    it("has transcribe() static method", () => {
      expect(typeof NodeLLM.transcribe).toBe("function");
    });
  });

  describe("Embeddings", () => {
    it("has embed() static method", () => {
      expect(typeof NodeLLM.embed).toBe("function");
    });
  });

  describe("Moderation", () => {
    it("has moderate() static method if available", () => {
      if (typeof NodeLLM.moderate === "function") {
        expect(typeof NodeLLM.moderate).toBe("function");
      }
    });
  });
});
