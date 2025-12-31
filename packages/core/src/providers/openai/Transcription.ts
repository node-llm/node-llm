import { TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { AudioUtils } from "../../utils/audio.js";
import { DEFAULT_MODELS } from "../../constants.js";

export class OpenAITranscription {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const model = request.model || DEFAULT_MODELS.TRANSCRIPTION;

    if (model.startsWith("gpt-4o")) {
      return this.transcribeViaChat(request);
    }

    return this.transcribeViaWhisper(request);
  }

  private async transcribeViaWhisper(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    const { data, fileName, duration: estimatedDuration } = await AudioUtils.load(request.file);
    
    const mimeType = fileName.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    const file = new File([data] as any, fileName, { type: mimeType });
    formData.append("file", file);
    formData.append("model", request.model || DEFAULT_MODELS.TRANSCRIPTION);
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
      await handleOpenAIError(response, request.model || DEFAULT_MODELS.TRANSCRIPTION);
    }

    const json = (await response.json()) as { text: string; model: string; duration?: number; segments?: any[] };
    return { 
      text: json.text,
      model: json.model || request.model || DEFAULT_MODELS.TRANSCRIPTION,
      duration: json.duration || estimatedDuration,
      segments: json.segments?.map(s => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };
  }

  private async transcribeViaChat(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const { data, fileName, duration: estimatedDuration } = await AudioUtils.load(request.file);
    const base64Audio = Buffer.from(data).toString("base64");
    const model = request.model || "gpt-4o";
    
    let actualModel = "gpt-4o-audio-preview";
    let defaultPrompt = "Transcribe the audio exactly. Return only the transcription text.";
    let isDiarization = false;

    if (model.includes("diarize")) {
      isDiarization = true;
      const names = request.speakerNames?.join(", ") || "Speaker A, Speaker B";
      defaultPrompt = `Transcribe the audio and identify different speakers. 
      I will provide reference clips for specific voices. Please map the voices in the main audio to these names: ${names}.
      Return the output as a JSON array of objects, each with 'speaker', 'text', 'start', and 'end' (in seconds).
      Example: [{"speaker": "Alice", "text": "Hello", "start": 0.5, "end": 1.2}]`;
    }

    if (request.language) {
      defaultPrompt += ` The audio is in ${request.language}.`;
    }

    const messagesContent: any[] = [
      { 
        type: "text", 
        text: request.prompt 
          ? `${defaultPrompt}\n\nContext for transcription: ${request.prompt}`
          : defaultPrompt 
      }
    ];

    if (request.speakerReferences && request.speakerNames) {
      for (let i = 0; i < request.speakerReferences.length; i++) {
        const refFile = request.speakerReferences[i];
        if (!refFile) continue;
        
        const name = request.speakerNames[i] || `Speaker ${i + 1}`;
        const { data: refData } = await AudioUtils.load(refFile);
        const refBase64 = Buffer.from(refData).toString("base64");
        
        messagesContent.push({
          type: "text",
          text: `The following audio clip is the voice of ${name}:`
        });
        messagesContent.push({
          type: "input_audio",
          input_audio: {
            data: refBase64,
            format: refFile.endsWith(".wav") ? "wav" : "mp3"
          }
        });
      }
      messagesContent.push({
        type: "text",
        text: "Now, transcribe this main audio file using identified names:"
      });
    }

    messagesContent.push({
      type: "input_audio",
      input_audio: {
        data: base64Audio,
        format: fileName.endsWith(".wav") ? "wav" : "mp3"
      }
    });

    const body = {
      model: actualModel,
      messages: [
        {
          role: "user",
          content: messagesContent
        }
      ]
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
        text = content;
      }
    }

    return {
      text,
      model,
      duration: estimatedDuration || 0,
      segments
    };
  }
}
