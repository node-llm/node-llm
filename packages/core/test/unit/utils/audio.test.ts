import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioUtils } from "../../../src/utils/audio.js";
import fs from "fs";
import path from "path";

// Mock fs and fetch
vi.mock("fs", () => ({
  default: {
    promises: {
      readFile: vi.fn()
    }
  }
}));

describe("AudioUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("load", () => {
    it("loads local file successfully", async () => {
      const mockData = Buffer.from("fake audio data");
      vi.mocked(fs.promises.readFile).mockResolvedValue(mockData);

      const result = await AudioUtils.load("/path/to/audio.mp3");

      expect(result.fileName).toBe("audio.mp3");
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(fs.promises.readFile).toHaveBeenCalledWith("/path/to/audio.mp3");
    });

    it("loads remote file via HTTP", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      } as Response);

      const result = await AudioUtils.load("https://example.com/audio.wav");

      expect(result.fileName).toBe("audio.wav");
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(global.fetch).toHaveBeenCalledWith("https://example.com/audio.wav");
    });

    it("throws error when remote fetch fails", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Not Found"
      } as Response);

      await expect(AudioUtils.load("https://example.com/missing.mp3")).rejects.toThrow(
        "Failed to fetch remote audio file: Not Found"
      );
    });

    it("uses default filename for URL without path", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      } as Response);

      const result = await AudioUtils.load("https://example.com/");

      expect(result.fileName).toBe("audio.mp3"); // Default fallback
    });
  });

  describe("estimateDuration", () => {
    it("estimates WAV duration correctly", () => {
      // Create a minimal WAV header structure
      // ByteRate at offset 28 (4 bytes, little endian)
      // DataSize at offset 40 (4 bytes, little endian)
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);
      view.setUint32(28, 44100 * 2, true); // ByteRate: 44100 Hz * 2 bytes (16-bit mono)
      view.setUint32(40, 88200, true); // DataSize: 88200 bytes = 1 second of audio

      const data = new Uint8Array(buffer);
      const duration = AudioUtils.estimateDuration(data, "test.wav");

      expect(duration).toBe(1); // 88200 / 88200 = 1 second
    });

    it("estimates MP3 duration using 128kbps assumption", () => {
      // Create a buffer simulating 1 second of 128kbps MP3
      // 128kbps = 128000 bits/sec = 16000 bytes/sec
      const bytesForOneSecond = 128000 / 8; // 16000 bytes
      const data = new Uint8Array(bytesForOneSecond);

      const duration = AudioUtils.estimateDuration(data, "test.mp3");

      expect(duration).toBeCloseTo(1, 1);
    });

    it("returns undefined for unsupported formats", () => {
      const data = new Uint8Array(100);
      const duration = AudioUtils.estimateDuration(data, "audio.ogg");

      expect(duration).toBeUndefined();
    });

    it("returns undefined when WAV byteRate is zero", () => {
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);
      view.setUint32(28, 0, true); // ByteRate: 0 (invalid)
      view.setUint32(40, 88200, true);

      const data = new Uint8Array(buffer);
      const duration = AudioUtils.estimateDuration(data, "test.wav");

      expect(duration).toBeUndefined();
    });

    it("handles corrupted WAV data gracefully", () => {
      // Very short buffer that would cause DataView errors
      const data = new Uint8Array(10);

      // Should not throw, just return undefined
      const duration = AudioUtils.estimateDuration(data, "corrupt.wav");
      expect(duration).toBeUndefined();
    });
  });
});
