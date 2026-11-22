import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { config } from "../config.js";
import {
  FileAccessError,
  FileSecurity,
  checkLocalFile,
  headerOf,
  readRemoteChecked
} from "./FileSecurity.js";

export interface Base64Data {
  data: string;
  mimeType: string;
}

export class BinaryUtils {
  /**
   * Converts a URL (data:, http:, or local path) to a base64 string and mime type. URLs and
   * paths are checked like a chat's `files`; a refused one throws FileAccessError.
   */
  static async toBase64(
    url: string,
    rules: FileSecurity | undefined = config.fileSecurity
  ): Promise<Base64Data | null> {
    if (url.startsWith("data:")) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match && match[1] && match[2]) {
        return {
          mimeType: match[1],
          data: match[2]
        };
      }
    } else if (url.startsWith("http")) {
      try {
        const { response, bytes } = await readRemoteChecked(url, rules);
        if (!bytes) return null;
        const base64 = Buffer.from(bytes).toString("base64");
        const mimeType = headerOf(response, "content-type") || this.guessMimeType(url);
        return {
          mimeType,
          data: base64
        };
      } catch (e) {
        if (e instanceof FileAccessError) throw e;
        logger.error("Error converting URL to base64:", e as Error);
        return null;
      }
    } else {
      // Assume local file path
      try {
        const buffer = await fs.promises.readFile(await checkLocalFile(url, rules));
        const base64 = buffer.toString("base64");
        const mimeType = this.guessMimeType(url);
        return {
          mimeType,
          data: base64
        };
      } catch (e) {
        if (e instanceof FileAccessError) throw e;
        logger.error("Error reading local file for base64:", e as Error);
        return null;
      }
    }
    return null;
  }

  /**
   * Converts a Base64Data object to a Blob.
   */
  static base64ToBlob(binary: Base64Data): Blob {
    return new Blob([new Uint8Array(this.base64ToBuffer(binary))], { type: binary.mimeType });
  }

  /**
   * Converts a Base64Data object to a Buffer.
   */
  static base64ToBuffer(binary: Base64Data): Buffer {
    return Buffer.from(binary.data, "base64");
  }

  private static guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".png":
        return "image/png";
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".webp":
        return "image/webp";
      case ".gif":
        return "image/gif";
      case ".mp3":
        return "audio/mpeg";
      case ".wav":
        return "audio/wav";
      case ".ogg":
        return "audio/ogg";
      case ".m4a":
        return "audio/mp4";
      case ".pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }
}
