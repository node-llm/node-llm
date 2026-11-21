import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeneratedImage } from "../../../src/image/GeneratedImage.js";
import fs from "fs/promises";
import { Readable } from "stream";

describe("GeneratedImage", () => {
  describe("Constructor and basic properties", () => {
    it("should create instance with URL", () => {
      const image = new GeneratedImage({
        url: "https://example.com/image.png"
      });

      expect(image.url).toBe("https://example.com/image.png");
      expect(image.data).toBeUndefined();
      expect(image.isBase64).toBe(false);
      expect(image.toString()).toBe("https://example.com/image.png");
    });

    it("should create instance with base64 data", () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const image = new GeneratedImage({
        data: base64Data,
        mime_type: "image/png"
      });

      expect(image.data).toBe(base64Data);
      expect(image.url).toBeUndefined();
      expect(image.isBase64).toBe(true);
      expect(image.mimeType).toBe("image/png");
    });

    it("should handle revised prompt", () => {
      const image = new GeneratedImage({
        url: "https://example.com/image.png",
        revised_prompt: "A beautiful sunset over mountains"
      });

      expect(image.revisedPrompt).toBe("A beautiful sunset over mountains");
    });

    it("should return empty string when no URL or data", () => {
      const image = new GeneratedImage({});
      expect(image.toString()).toBe("");
    });
  });

  describe("toBuffer", () => {
    it("should convert base64 data to buffer", async () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const image = new GeneratedImage({
        data: base64Data
      });

      const buffer = await image.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString("base64")).toBe(base64Data);
    });

    it("should fetch and convert URL to buffer", async () => {
      const mockBuffer = Buffer.from("fake image data");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockBuffer.buffer
      });

      const image = new GeneratedImage({
        url: "https://example.com/image.png"
      });

      const buffer = await image.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/image.png",
        expect.objectContaining({ redirect: "manual" })
      );
    });

    it("should throw error when URL fetch fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found"
      });

      const image = new GeneratedImage({
        url: "https://example.com/missing.png"
      });

      await expect(image.toBuffer()).rejects.toThrow(
        "Failed to download image from https://example.com/missing.png: Not Found"
      );
    });

    it("should throw error when no data or URL available", async () => {
      const image = new GeneratedImage({});

      await expect(image.toBuffer()).rejects.toThrow("No image data or URL available");
    });
  });

  describe("toStream", () => {
    it("should convert buffer to readable stream", async () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const image = new GeneratedImage({
        data: base64Data
      });

      const stream = await image.toStream();
      expect(stream).toBeInstanceOf(Readable);

      // Read the stream
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const result = Buffer.concat(chunks);
      expect(result.toString("base64")).toBe(base64Data);
    });
  });

  describe("save", () => {
    const testPath = "/tmp/test-image.png";

    beforeEach(() => {
      vi.spyOn(fs, "writeFile").mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should save base64 image to file", async () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const image = new GeneratedImage({
        data: base64Data
      });

      const result = await image.save(testPath);
      expect(result).toBe(testPath);
      expect(fs.writeFile).toHaveBeenCalledWith(testPath, expect.any(Buffer));
    });

    it("should save URL image to file", async () => {
      const mockBuffer = Buffer.from("fake image data");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockBuffer.buffer
      });

      const image = new GeneratedImage({
        url: "https://example.com/image.png"
      });

      const result = await image.save(testPath);
      expect(result).toBe(testPath);
      expect(fs.writeFile).toHaveBeenCalledWith(testPath, expect.any(Buffer));
    });
  });
});
