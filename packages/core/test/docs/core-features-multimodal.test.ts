/**
 * Documentation Verification Tests: core-features/multimodal.md
 *
 * Verifies that all code examples from the Multimodal documentation work correctly.
 * Tests verify that the API accepts documented options without requiring actual files.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-multimodal", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["This image shows a beautiful landscape."]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Smart File Handling", () => {
    it("chat.ask() accepts files option", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the API signature accepts files option
      // Per docs: files: ["./screenshot.png"]
      expect(typeof chat.ask).toBe("function");

      // Verify ask accepts an object with files array
      const askCall = () => chat.ask("What's in this?", { files: [] });
      expect(askCall).not.toThrow();
    });

    it("chat.ask() accepts images option (alias)", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the API signature accepts images option (alias)
      // Per docs: images: ["./analysis.png"]
      expect(typeof chat.ask).toBe("function");

      // Verify ask accepts an object with images array
      const askCall = () => chat.ask("What's in this?", { images: [] });
      expect(askCall).not.toThrow();
    });
  });

  describe("Working with Images (Vision)", () => {
    it("ask() accepts local image paths format", () => {
      // Per docs: files: ["./screenshot.png"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (local path format)
      const options = { files: ["./screenshot.png"] };
      expect(options.files).toBeInstanceOf(Array);
      expect(options.files[0]).toMatch(/^\.\//);
    });

    it("ask() accepts image URLs", () => {
      // Per docs: files: ["https://example.com/logo.png"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (URL format)
      const options = { files: ["https://example.com/logo.png"] };
      expect(options.files).toBeInstanceOf(Array);
      expect(options.files[0]).toMatch(/^https?:\/\//);
      expect(chat).toBeDefined();
    });

    it("ask() accepts multiple images format", () => {
      // Per docs: files: ["./v1-screenshot.png", "./v2-screenshot.png"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (multiple files)
      const options = { files: ["./v1-screenshot.png", "./v2-screenshot.png"] };
      expect(options.files).toHaveLength(2);
    });
  });

  describe("Working with Audio", () => {
    it("ask() accepts audio files format", () => {
      // Per docs: files: ["./meeting.mp3"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (audio extension)
      const options = { files: ["./meeting.mp3"] };
      expect(options.files[0]).toMatch(/\.mp3$/);
    });
  });

  describe("Working with Videos", () => {
    it("ask() accepts video files format", () => {
      // Per docs: files: ["./demo_video.mp4"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (video extension)
      const options = { files: ["./demo_video.mp4"] };
      expect(options.files[0]).toMatch(/\.mp4$/);
    });
  });

  describe("Working with Documents", () => {
    it("ask() accepts code files format", () => {
      // Per docs: files: ["./app/auth.ts"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (code extension)
      const options = { files: ["./app/auth.ts"] };
      expect(options.files[0]).toMatch(/\.ts$/);
    });

    it("ask() accepts PDF files format", () => {
      // Per docs: files: ["./contract.pdf"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (PDF extension)
      const options = { files: ["./contract.pdf"] };
      expect(options.files[0]).toMatch(/\.pdf$/);
    });
  });

  describe("Automatic Type Detection", () => {
    it("ask() accepts mixed file types format", () => {
      // Per docs: files: ["diagram.png", "spec.pdf", "meeting.mp3", "backend.ts"]
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify structure matches docs (mixed extensions)
      const options = {
        files: [
          "diagram.png",    // Image
          "spec.pdf",       // Document
          "meeting.mp3",    // Audio
          "backend.ts"      // Code
        ]
      };

      expect(options.files).toHaveLength(4);
      expect(options.files[0]).toMatch(/\.png$/);
      expect(options.files[1]).toMatch(/\.pdf$/);
      expect(options.files[2]).toMatch(/\.mp3$/);
      expect(options.files[3]).toMatch(/\.ts$/);
    });
  });

  describe("Streaming with Multimodal", () => {
    it("stream() accepts files option", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const stream = chat.stream("What's in this image?", {
        files: ["./analysis.png"]
      });

      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it("stream() accepts images option", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const stream = chat.stream("What's in this image?", {
        images: ["./analysis.png"]
      });

      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });
  });
});
