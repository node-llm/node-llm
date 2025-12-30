import fs from "fs/promises";
import { Readable } from "stream";
import { ImageResponse } from "../providers/Provider.js";

export class GeneratedImage {
  constructor(private readonly response: ImageResponse) {}

  get url(): string | undefined {
    return this.response.url;
  }

  get data(): string | undefined {
    return this.response.data;
  }

  get revisedPrompt(): string | undefined {
    return this.response.revised_prompt;
  }

  get mimeType(): string | undefined {
    return this.response.mime_type;
  }

  get isBase64(): boolean {
    return !!this.data;
  }

  /**
   * Returns the raw binary image data as a Buffer.
   */
  async toBuffer(): Promise<Buffer> {
    if (this.data) {
      return Buffer.from(this.data, "base64");
    }

    if (this.url) {
      const resp = await fetch(this.url);
      if (!resp.ok) {
        throw new Error(`Failed to download image from ${this.url}: ${resp.statusText}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw new Error("No image data or URL available");
  }

  /**
   * Returns a Readable stream of the image data.
   */
  async toStream(): Promise<Readable> {
    const buffer = await this.toBuffer();
    return Readable.from(buffer);
  }

  /**
   * Saves the image to the specified local path.
   */
  async save(path: string): Promise<string> {
    const buffer = await this.toBuffer();
    await fs.writeFile(path, buffer);
    return path;
  }
}
