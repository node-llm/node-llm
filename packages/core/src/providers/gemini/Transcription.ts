import { TranscriptionRequest, TranscriptionResponse } from "../Provider.js";
import { handleGeminiError } from "./Errors.js";
import { BinaryUtils } from "../../utils/Binary.js";
import { GeminiGenerateContentRequest, GeminiGenerateContentResponse } from "./types.js";
import { logger } from "../../utils/logger.js";

export class GeminiTranscription {
  private static readonly DEFAULT_PROMPT = "Transcribe the provided audio and respond with only the transcript text.";

  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const model = request.model || "gemini-2.0-flash";
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const result = await BinaryUtils.toBase64(request.file);
    if (!result) {
      throw new Error(`Failed to load audio file: ${request.file}`);
    }
    const { data: base64Data, mimeType } = result;

    let prompt = GeminiTranscription.DEFAULT_PROMPT;
    if (request.language) {
      prompt += ` Respond in the ${request.language} language.`;
    }
    if (request.prompt) {
      prompt += ` ${request.prompt}`;
    }

    const payload: GeminiGenerateContentRequest = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "text/plain",
      },
    };

    logger.logRequest("Gemini", "POST", url, payload);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleGeminiError(response, model);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;
    logger.logResponse("Gemini", response.status, response.statusText, json);
    const text = json.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";

    return {
      text,
      model,
      segments: [], // Gemini's generateContent doesn't return segments by default
    };
  }
}
