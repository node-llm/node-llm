import { TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import fs from "fs";
import path from "path";

export class OpenAITranscription {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    let data: Uint8Array;
    let fileName: string;

    if (request.file.startsWith("http")) {
      const response = await fetch(request.file);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote audio file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
      const urlPath = new URL(request.file).pathname;
      fileName = path.basename(urlPath) || "audio.mp3";
    } else {
      const buffer = fs.readFileSync(request.file);
      data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
      fileName = path.basename(request.file);
    }
    
    const mimeType = request.file.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    const file = new File([data] as any, fileName, { type: mimeType });
    formData.append("file", file);
    formData.append("model", request.model || "whisper-1");
    formData.append("response_format", "verbose_json");
    
    if (request.prompt) {
      formData.append("prompt", request.prompt);
    }
    
    if (request.language) {
      formData.append("language", request.language);
    }

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model || "whisper-1");
    }

    const json = (await response.json()) as { text: string; duration?: number; segments?: any[] };
    return { 
      text: json.text,
      duration: json.duration,
      segments: json.segments?.map(s => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };
  }
}
