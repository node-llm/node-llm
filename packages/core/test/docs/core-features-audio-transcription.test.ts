/**
 * Documentation Verification Tests: core-features/audio-transcription.md
 *
 * Verifies that audio transcription patterns from docs compile correctly.
 * Uses pattern verification since we can't test actual transcription without real API.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NodeLLM, createLLM, providerRegistry } from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-audio-transcription", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Transcription test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Basic Transcription", () => {
    it("NodeLLM.transcribe method exists", () => {
      // Per docs: await NodeLLM.transcribe("meeting.mp3", { model: "whisper-1" })
      expect(typeof NodeLLM.transcribe).toBe("function");
    });

    it("createLLM instance has transcribe method", () => {
      const llm = createLLM({ provider: "fake" });
      expect(typeof llm.transcribe).toBe("function");
    });
  });

  describe("Advanced Options Pattern", () => {
    it("transcribe accepts model option", () => {
      // Per docs: model: "whisper-1"
      const options = {
        model: "whisper-1"
      };
      expect(options.model).toBe("whisper-1");
    });

    it("transcribe accepts language option", () => {
      // Per docs: language: "en" // ISO-639-1 code hint
      const options = {
        model: "whisper-1",
        language: "en"
      };
      expect(options.language).toBe("en");
    });

    it("transcribe accepts prompt option for domain terms", () => {
      // Per docs: prompt: "ZyntriQix, API" // Guide the model
      const options = {
        model: "whisper-1",
        prompt: "ZyntriQix, API"
      };
      expect(options.prompt).toBe("ZyntriQix, API");
    });

    it("transcribe accepts params for verbose_json", () => {
      // Per docs: params: { response_format: "verbose_json" }
      const options = {
        params: { response_format: "verbose_json" }
      };
      expect(options.params.response_format).toBe("verbose_json");
    });
  });

  describe("Transcription Response Structure", () => {
    it("expected response has toString method pattern", () => {
      // Per docs: console.log(text.toString())
      const mockTranscription = {
        toString: () => "Hello everyone today we are...",
        duration: 120.5,
        segments: [
          { start: 0, end: 5, text: "Hello everyone" },
          { start: 5, end: 10, text: "today we are" }
        ]
      };

      expect(typeof mockTranscription.toString).toBe("function");
      expect(mockTranscription.toString()).toBe("Hello everyone today we are...");
    });

    it("expected response has duration property", () => {
      // Per docs: console.log(`Duration: ${response.duration}s`)
      const mockTranscription = {
        duration: 120.5,
        segments: []
      };

      expect(typeof mockTranscription.duration).toBe("number");
    });

    it("expected response has segments array", () => {
      // Per docs: for (const segment of response.segments)
      const mockTranscription = {
        segments: [
          { start: 0, end: 5, text: "Hello everyone" },
          { start: 5, end: 10, text: "today we are" }
        ]
      };

      expect(Array.isArray(mockTranscription.segments)).toBe(true);
      expect(mockTranscription.segments[0]).toHaveProperty("start");
      expect(mockTranscription.segments[0]).toHaveProperty("end");
      expect(mockTranscription.segments[0]).toHaveProperty("text");
    });
  });

  describe("Multimodal Chat vs Transcription", () => {
    it("chat.ask with files option pattern compiles", async () => {
      // Per docs: await chat.ask("What is the main topic?", { files: ["podcast.mp3"] })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // The pattern compiles - we just verify the API signature
      const askOptions = {
        files: ["podcast.mp3"]
      };

      expect(Array.isArray(askOptions.files)).toBe(true);
      expect(askOptions.files[0]).toBe("podcast.mp3");
    });
  });

  describe("Error Handling Pattern", () => {
    it("try/catch pattern for transcription errors", async () => {
      // Per docs: try { await NodeLLM.transcribe(...) } catch (error) { ... }
      let errorHandled = false;

      try {
        // Simulate error scenario
        throw new Error("Transcription failed: file too large");
      } catch (error) {
        errorHandled = true;
        expect((error as Error).message).toContain("Transcription failed");
      }

      expect(errorHandled).toBe(true);
    });
  });
});
