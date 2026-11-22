import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BinaryUtils } from "../../../src/utils/Binary.js";
import fs from "fs";

describe("BinaryUtils", () => {
  describe("toBase64", () => {
    describe("data: URLs", () => {
      it("should parse valid data URL", async () => {
        const dataUrl =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        const result = await BinaryUtils.toBase64(dataUrl);

        expect(result).toEqual({
          mimeType: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        });
      });

      it("should handle data URL with different mime types", async () => {
        const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
        const result = await BinaryUtils.toBase64(dataUrl);

        expect(result).toEqual({
          mimeType: "image/jpeg",
          data: "/9j/4AAQSkZJRg=="
        });
      });

      it("should return null for invalid data URL", async () => {
        const invalidUrl = "data:invalid";
        const result = await BinaryUtils.toBase64(invalidUrl);
        expect(result).toBeNull();
      });
    });

    describe("HTTP URLs", () => {
      beforeEach(() => {
        vi.restoreAllMocks();
      });

      it("should fetch and convert HTTP URL to base64", async () => {
        const mockBuffer = Buffer.from("test image data");
        const arrayBuffer = mockBuffer.buffer.slice(
          mockBuffer.byteOffset,
          mockBuffer.byteOffset + mockBuffer.byteLength
        );

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => arrayBuffer,
          headers: new Map([["content-type", "image/png"]])
        });

        const result = await BinaryUtils.toBase64("https://example.com/image.png");

        expect(result).toEqual({
          mimeType: "image/png",
          data: mockBuffer.toString("base64")
        });
        expect(global.fetch).toHaveBeenCalledWith(
          "https://example.com/image.png",
          expect.objectContaining({ redirect: "manual" })
        );
      });

      it("should guess mime type when content-type header is missing", async () => {
        const mockBuffer = Buffer.from("test image data");
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => mockBuffer.buffer,
          headers: new Map()
        });

        const result = await BinaryUtils.toBase64("https://example.com/image.jpg");

        expect(result?.mimeType).toBe("image/jpeg");
      });

      it("should return null when fetch fails", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false
        });

        const result = await BinaryUtils.toBase64("https://example.com/missing.png");
        expect(result).toBeNull();
      });

      it("should return null when fetch throws error", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

        const result = await BinaryUtils.toBase64("https://example.com/image.png");
        expect(result).toBeNull();
      });
    });

    describe("Local file paths", () => {
      beforeEach(() => {
        vi.restoreAllMocks();
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("should read and convert local PNG file", async () => {
        const mockBuffer = Buffer.from("fake png data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/image.png");

        expect(result).toEqual({
          mimeType: "image/png",
          data: mockBuffer.toString("base64")
        });
      });

      it("should handle JPEG files", async () => {
        const mockBuffer = Buffer.from("fake jpeg data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/image.jpg");
        expect(result?.mimeType).toBe("image/jpeg");

        const result2 = await BinaryUtils.toBase64("/path/to/image.jpeg");
        expect(result2?.mimeType).toBe("image/jpeg");
      });

      it("should handle WebP files", async () => {
        const mockBuffer = Buffer.from("fake webp data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/image.webp");
        expect(result?.mimeType).toBe("image/webp");
      });

      it("should handle GIF files", async () => {
        const mockBuffer = Buffer.from("fake gif data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/image.gif");
        expect(result?.mimeType).toBe("image/gif");
      });

      it("should handle audio files", async () => {
        const mockBuffer = Buffer.from("fake audio data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const mp3 = await BinaryUtils.toBase64("/path/to/audio.mp3");
        expect(mp3?.mimeType).toBe("audio/mpeg");

        const wav = await BinaryUtils.toBase64("/path/to/audio.wav");
        expect(wav?.mimeType).toBe("audio/wav");

        const ogg = await BinaryUtils.toBase64("/path/to/audio.ogg");
        expect(ogg?.mimeType).toBe("audio/ogg");

        const m4a = await BinaryUtils.toBase64("/path/to/audio.m4a");
        expect(m4a?.mimeType).toBe("audio/mp4");
      });

      it("should handle PDF files", async () => {
        const mockBuffer = Buffer.from("fake pdf data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/document.pdf");
        expect(result?.mimeType).toBe("application/pdf");
      });

      it("should use default mime type for unknown extensions", async () => {
        const mockBuffer = Buffer.from("fake data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/file.xyz");
        expect(result?.mimeType).toBe("application/octet-stream");
      });

      it("should return null when file read fails", async () => {
        vi.spyOn(fs.promises, "readFile").mockRejectedValue(new Error("File not found"));

        const result = await BinaryUtils.toBase64("/path/to/missing.png");
        expect(result).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("should return null for empty string", async () => {
        const result = await BinaryUtils.toBase64("");
        expect(result).toBeNull();
      });

      it("should handle uppercase file extensions", async () => {
        const mockBuffer = Buffer.from("fake data");
        vi.spyOn(fs.promises, "readFile").mockResolvedValue(mockBuffer);

        const result = await BinaryUtils.toBase64("/path/to/IMAGE.PNG");
        expect(result?.mimeType).toBe("image/png");
      });
    });
  });
});
