import { describe, it, expect } from "vitest";
import { MistralCapabilities } from "../../../../src/providers/mistral/Capabilities.js";

describe("Mistral Capabilities", () => {
  describe("supportsVision", () => {
    it("should return true for pixtral models", () => {
      expect(MistralCapabilities.supportsVision("pixtral-large-latest")).toBe(true);
      expect(MistralCapabilities.supportsVision("pixtral-12b-2024")).toBe(true);
    });

    it("should return false for non-vision models", () => {
      expect(MistralCapabilities.supportsVision("mistral-large-latest")).toBe(false);
      expect(MistralCapabilities.supportsVision("mistral-small-latest")).toBe(false);
      expect(MistralCapabilities.supportsVision("codestral-latest")).toBe(false);
    });
  });

  describe("supportsTools", () => {
    it("should return true for chat models", () => {
      expect(MistralCapabilities.supportsTools("mistral-large-latest")).toBe(true);
      expect(MistralCapabilities.supportsTools("mistral-small-latest")).toBe(true);
      expect(MistralCapabilities.supportsTools("mistral-medium-latest")).toBe(true);
    });

    it("should return false for embedding models", () => {
      expect(MistralCapabilities.supportsTools("mistral-embed")).toBe(false);
    });
  });

  describe("supportsStructuredOutput", () => {
    it("should return true for chat models", () => {
      expect(MistralCapabilities.supportsStructuredOutput("mistral-large-latest")).toBe(true);
      expect(MistralCapabilities.supportsStructuredOutput("mistral-small-latest")).toBe(true);
    });

    it("should return false for embedding models", () => {
      expect(MistralCapabilities.supportsStructuredOutput("mistral-embed")).toBe(false);
    });
  });

  describe("supportsEmbeddings", () => {
    it("should return true for embed model", () => {
      expect(MistralCapabilities.supportsEmbeddings("mistral-embed")).toBe(true);
    });

    it("should return false for chat models", () => {
      expect(MistralCapabilities.supportsEmbeddings("mistral-large-latest")).toBe(false);
      expect(MistralCapabilities.supportsEmbeddings("codestral-latest")).toBe(false);
    });
  });

  describe("getContextWindow", () => {
    it("should return correct context window for large models", () => {
      expect(MistralCapabilities.getContextWindow("mistral-large-latest")).toBe(128000);
    });

    it("should return correct context window for small models", () => {
      expect(MistralCapabilities.getContextWindow("mistral-small-latest")).toBe(32000);
    });

    it("should return default for unknown models", () => {
      expect(MistralCapabilities.getContextWindow("unknown-model")).toBe(32000);
    });
  });

  describe("supportsReasoning", () => {
    it("should return false for all models (no dedicated reasoning models)", () => {
      expect(MistralCapabilities.supportsReasoning("mistral-large-latest")).toBe(false);
      expect(MistralCapabilities.supportsReasoning("mistral-small-latest")).toBe(false);
    });
  });

  describe("supportsTranscription", () => {
    it("should return true for voxtral models", () => {
      expect(MistralCapabilities.supportsTranscription("voxtral-mini-latest")).toBe(true);
      expect(MistralCapabilities.supportsTranscription("voxtral-small-latest")).toBe(true);
    });

    it("should return false for non-audio models", () => {
      expect(MistralCapabilities.supportsTranscription("mistral-large-latest")).toBe(false);
      expect(MistralCapabilities.supportsTranscription("mistral-embed")).toBe(false);
    });
  });

  describe("supportsModeration", () => {
    it("should return true for moderation models", () => {
      expect(MistralCapabilities.supportsModeration("mistral-moderation-latest")).toBe(true);
      expect(MistralCapabilities.supportsModeration("mistral-moderation-2411")).toBe(true);
    });

    it("should return false for non-moderation models", () => {
      expect(MistralCapabilities.supportsModeration("mistral-large-latest")).toBe(false);
      expect(MistralCapabilities.supportsModeration("mistral-embed")).toBe(false);
    });
  });
});
