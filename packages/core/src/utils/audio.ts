import fs from "fs";
import path from "path";
import { config } from "../config.js";
import { checkLocalFile, FileSecurity, readRemoteChecked } from "./FileSecurity.js";

export interface AudioFileData {
  data: Uint8Array;
  fileName: string;
  duration?: number;
}

export class AudioUtils {
  /** Loads audio from a URL or path, checked like a chat's `files`. */
  static async load(
    filePath: string,
    rules: FileSecurity | undefined = config.fileSecurity
  ): Promise<AudioFileData> {
    let data: Uint8Array;
    let fileName: string;

    if (filePath.startsWith("http")) {
      const { response, bytes } = await readRemoteChecked(filePath, rules);
      if (!bytes) {
        throw new Error(`Failed to fetch remote audio file: ${response.statusText}`);
      }
      data = new Uint8Array(bytes);
      const urlPath = new URL(filePath).pathname;
      fileName = path.basename(urlPath) || "audio.mp3";
    } else {
      const buffer = await fs.promises.readFile(await checkLocalFile(filePath, rules));
      data = new Uint8Array(buffer);
      fileName = path.basename(filePath);
    }

    const duration = this.estimateDuration(data, fileName);
    return { data, fileName, duration };
  }

  static estimateDuration(data: Uint8Array, fileName: string): number | undefined {
    try {
      const ext = path.extname(fileName).toLowerCase();
      if (ext === ".wav") {
        // Simple WAV duration: (DataSize / ByteRate)
        const view = new DataView(data.buffer, data.byteOffset, data.length);
        const byteRate = view.getUint32(28, true);
        const dataSize = view.getUint32(40, true);
        if (byteRate > 0) return dataSize / byteRate;
      } else if (ext === ".mp3") {
        // Very rough MP3 estimate (assume 128kbps)
        return data.length / (128000 / 8);
      }
    } catch {
      // Ignore estimation errors
    }
    return undefined;
  }
}
