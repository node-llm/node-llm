import fs from "fs";
import path from "path";

export interface AudioFileData {
  data: Uint8Array;
  fileName: string;
  duration?: number;
}

export class AudioUtils {
  static async load(filePath: string): Promise<AudioFileData> {
    let data: Uint8Array;
    let fileName: string;

    if (filePath.startsWith("http")) {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote audio file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
      const urlPath = new URL(filePath).pathname;
      fileName = path.basename(urlPath) || "audio.mp3";
    } else {
      const buffer = await fs.promises.readFile(filePath);
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
    } catch (e) {
      // Ignore estimation errors
    }
    return undefined;
  }
}
