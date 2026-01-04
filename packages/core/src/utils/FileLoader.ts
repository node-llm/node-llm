import { promises as fs } from "fs";
import * as path from "path";
import { ContentPart } from "../chat/Content.js";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mov": "video/quicktime",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".cjs": "text/javascript",
  ".ts": "text/typescript",
  ".rb": "text/x-ruby",
  ".py": "text/x-python",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".html": "text/html",
  ".css": "text/css",
  ".xml": "text/xml",
  ".yml": "text/yaml",
  ".yaml": "text/yaml",
  ".csv": "text/csv",
  ".go": "text/x-go",
  ".java": "text/x-java",
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".rs": "text/x-rust",
  ".swift": "text/x-swift",
  ".kt": "text/x-kotlin",
  ".pdf": "application/pdf",
};

const TEXT_EXTENSIONS = new Set([
  ".json", ".js", ".mjs", ".cjs", ".ts", ".rb", ".py", ".txt", ".md", ".html", ".css", ".xml", ".yml", ".yaml", ".env",
  ".csv", ".go", ".java", ".c", ".cpp", ".rs", ".swift", ".kt"
]);

export class FileLoader {
  static async load(filePath: string): Promise<ContentPart> {
    if (filePath.startsWith("http")) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
        
        const buffer = await response.arrayBuffer();
        const contentTypeFull = response.headers.get("content-type") || "image/jpeg";
        const contentType = (contentTypeFull.split(";")[0] ?? "image/jpeg").trim();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUri = `data:${contentType};base64,${base64}`;
        
        if (contentType.startsWith("image/")) {
          return { type: "image_url", image_url: { url: dataUri } };
        }

        if (contentType.startsWith("audio/")) {
          const format = contentType.split("/")[1];
          return { 
            type: "input_audio", 
            input_audio: { 
              data: base64, 
              format: (format === "mpeg" ? "mp3" : format) ?? "wav"
            } 
          };
        }

        if (contentType.startsWith("video/")) {
          return { type: "video_url", video_url: { url: dataUri } };
        }

        // Default to image_url for unknown binary or use as-is
        return { type: "image_url", image_url: { url: dataUri } };
      } catch (error) {
        // Fallback to URL if fetch fails
        return { type: "image_url", image_url: { url: filePath } };
      }
    }

    if (filePath.startsWith("data:")) {
      return { type: "image_url", image_url: { url: filePath } };
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] ?? "application/octet-stream";

    if (TEXT_EXTENSIONS.has(ext)) {
      const content = await fs.readFile(filePath, "utf-8");
      return { 
        type: "text", 
        text: `\n\n--- File: ${path.basename(filePath)} ---\n${content}\n--- End of File ---\n` 
      };
    }

    // Binary files (Images, Video, Audio)
    const data = await fs.readFile(filePath);
    const base64 = data.toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;

    if (mime.startsWith("image/")) {
      return { type: "image_url", image_url: { url: dataUri } };
    }

    if (mime.startsWith("audio/")) {
      // OpenAI expects 'wav' or 'mp3' as format, not full mime
      const format = mime.split("/")[1]; 
      return { 
        type: "input_audio", 
        input_audio: { 
          data: base64, 
          format: (format === "mpeg" ? "mp3" : format) ?? "wav"
        } 
      };
    }

    if (mime.startsWith("video/")) {
      // For now, treat video as a URL (some providers might support data URIs for video)
      return { type: "video_url", video_url: { url: dataUri } };
    }

    // Fallback for unknown binary types
    return { type: "image_url", image_url: { url: dataUri } };
  }
}
