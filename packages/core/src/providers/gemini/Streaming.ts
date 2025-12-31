import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleGeminiError } from "./Errors.js";
import { GeminiGenerateContentResponse, GeminiPart } from "./types.js";

export class GeminiStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(request: ChatRequest): AsyncGenerator<ChatChunk> {
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    const url = `${this.baseUrl}/models/${request.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents: any[] = [];
    let systemInstructionParts: GeminiPart[] = [];

    for (const msg of request.messages) {
      if (msg.role === "system") {
        if (typeof msg.content === "string") {
          systemInstructionParts.push({ text: msg.content });
        }
      } else if (msg.role === "user" || msg.role === "assistant") {
        const parts: any[] = [];
        const role = msg.role === "assistant" ? "model" : "user";
        
        if (typeof msg.content === "string" && msg.content) {
          parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === "text") {
              parts.push({ text: part.text });
            }
          }
        }

        if (parts.length > 0) {
          contents.push({ role, parts });
        }
      }
    }

    const payload: any = {
      contents,
      generationConfig: {
        temperature: temperature ?? undefined,
        maxOutputTokens: request.max_tokens,
      },
    };

    if (systemInstructionParts.length > 0) {
      payload.systemInstruction = { parts: systemInstructionParts };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleGeminiError(response, request.model);
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let lineEnd;
      while ((lineEnd = buffer.indexOf("\n")) !== -1) {
        const line = buffer.substring(0, lineEnd).trim();
        buffer = buffer.substring(lineEnd + 1);

        if (line.startsWith("data: ")) {
          const data = line.substring(6).trim();
          if (!data) continue;

          try {
            const json = JSON.parse(data) as GeminiGenerateContentResponse;
            const part = json.candidates?.[0]?.content?.parts?.[0];
            if (part?.text) {
              yield { content: part.text };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
