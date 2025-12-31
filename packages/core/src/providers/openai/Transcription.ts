import { TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import fs from "fs";
import path from "path";

export class OpenAITranscription {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const model = request.model || "whisper-1";

    // Handle GPT-4o specialized transcription models
    if (model.startsWith("gpt-4o")) {
      return this.transcribeViaChat(request);
    }

    return this.transcribeViaWhisper(request);
  }

  private async transcribeViaWhisper(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    const { data, fileName } = await this.loadFileData(request.file);
    
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

    const json = (await response.json()) as { text: string; model: string; duration?: number; segments?: any[] };
    return { 
      text: json.text,
      model: json.model || request.model || "whisper-1",
      duration: json.duration,
      segments: json.segments?.map(s => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };
  }

  private async transcribeViaChat(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const { data } = await this.loadFileData(request.file);
    const base64Audio = Buffer.from(data).toString("base64");
    const model = request.model || "gpt-4o";
    
    // Map specialized model names to actual OpenAI models
    // GPT-4o audio specifically requires gpt-4o-audio-preview
    let actualModel = "gpt-4o-audio-preview";
    
    let defaultPrompt = "Transcribe the audio exactly. Return only the transcription text.";
    let isDiarization = false;

    if (model.includes("diarize")) {
      isDiarization = true;
      defaultPrompt = `Transcribe the audio and identify different speakers (e.g., Speaker A, Speaker B). 
      Return the output as a JSON array of objects, each with 'speaker', 'text', 'start', and 'end' (in seconds).
      Example: [{"speaker": "A", "text": "Hello", "start": 0.5, "end": 1.2}]`;
    }

    if (request.language) {
      defaultPrompt += ` The audio is in ${request.language}.`;
    }

    const body = {
      model: actualModel,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: request.prompt 
                ? `${defaultPrompt}\n\nContext for transcription: ${request.prompt}`
                : defaultPrompt 
            },
            {
              type: "input_audio",
              input_audio: {
                data: base64Audio,
                format: request.file.endsWith(".wav") ? "wav" : "mp3"
              }
            }
          ]
        }
      ],
      response_format: isDiarization ? { type: "json_object" } : undefined
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleOpenAIError(response, actualModel);
    }

    const json = await response.json();
    const content = json.choices[0]?.message?.content || "";
    
    let text = content;
    let segments: any[] = [];

    if (isDiarization) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          segments = parsed.map((s, i) => ({
            id: i,
            start: s.start || 0,
            end: s.end || 0,
            text: s.text || "",
            speaker: s.speaker
          }));
          text = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");
        }
      } catch (e) {
        // Fallback if parsing fails
        text = content;
      }
    }

    return {
      text,
      model,
      segments
    };
  }

  private async loadFileData(filePath: string): Promise<{ data: Uint8Array; fileName: string }> {
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
      const buffer = fs.readFileSync(filePath);
      data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
      fileName = path.basename(filePath);
    }

    return { data, fileName };
  }
}
