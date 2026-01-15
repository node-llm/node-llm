import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

export interface Base64Data {
  data: string;
  mimeType: string;
}

export class BinaryUtils {
  /**
   * Converts a URL (data:, http:, or local path) to a base64 string and mime type.
   */
  static async toBase64(url: string): Promise<Base64Data | null> {
    if (url.startsWith("data:")) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match && match[1] && match[2]) {
        return {
          mimeType: match[1],
          data: match[2],
        };
      }
    } else if (url.startsWith("http")) {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = response.headers.get("content-type") || this.guessMimeType(url);
        return {
          mimeType,
          data: base64,
        };
      } catch (e) {
        logger.error("Error converting URL to base64:", e as Error);
        return null;
      }
    } else {
      // Assume local file path
      try {
        const buffer = await fs.promises.readFile(url);
        const base64 = buffer.toString("base64");
        const mimeType = this.guessMimeType(url);
        return {
          mimeType,
          data: base64,
        };
      } catch (e) {
        logger.error("Error reading local file for base64:", e as Error);
        return null;
      }
    }
    return null;
  }

  private static guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".png": return "image/png";
      case ".jpg":
      case ".jpeg": return "image/jpeg";
      case ".webp": return "image/webp";
      case ".gif": return "image/gif";
      case ".mp3": return "audio/mpeg";
      case ".wav": return "audio/wav";
      case ".ogg": return "audio/ogg";
      case ".m4a": return "audio/mp4";
      case ".pdf": return "application/pdf";
      default: return "application/octet-stream";
    }
  }
}
