import { TranscriptionRequest, TranscriptionResponse, TranscriptionSegment } from "../Provider.js";
import { handleMistralError } from "./Errors.js";
import { AudioUtils } from "../../utils/audio.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

const DEFAULT_TRANSCRIPTION_MODEL = "voxtral-mini-latest";

interface MistralTranscriptionResponse {
  text: string;
  model?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    [key: string]: unknown;
  }>;
}

export class MistralTranscription {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    const { data, fileName, duration: estimatedDuration } = await AudioUtils.load(request.file);

    const mimeType = this.getMimeType(fileName);
    const file = new File([data as unknown as BlobPart], fileName, { type: mimeType });

    formData.append("file", file);
    formData.append("model", request.model || DEFAULT_TRANSCRIPTION_MODEL);
    formData.append("response_format", "verbose_json");

    if (request.prompt) {
      formData.append("prompt", request.prompt);
    }

    if (request.language) {
      formData.append("language", request.language);
    }

    const url = `${this.baseUrl}/audio/transcriptions`;
    logger.logRequest("Mistral", "POST", url, {
      model: request.model || DEFAULT_TRANSCRIPTION_MODEL,
      file: fileName
    });

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        body: formData
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleMistralError(response, request.model || DEFAULT_TRANSCRIPTION_MODEL);
    }

    const json = (await response.json()) as MistralTranscriptionResponse;
    logger.logResponse("Mistral", response.status, response.statusText, json);

    const segments: TranscriptionSegment[] | undefined = json.segments?.map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: s.text
    }));

    return {
      text: json.text,
      model: json.model || request.model || DEFAULT_TRANSCRIPTION_MODEL,
      duration: json.duration || estimatedDuration,
      segments
    };
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
      case "wav":
        return "audio/wav";
      case "mp3":
        return "audio/mpeg";
      case "m4a":
        return "audio/mp4";
      case "flac":
        return "audio/flac";
      case "ogg":
        return "audio/ogg";
      case "webm":
        return "audio/webm";
      default:
        return "audio/mpeg";
    }
  }
}
