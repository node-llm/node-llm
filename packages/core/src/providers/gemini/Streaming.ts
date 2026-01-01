import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleGeminiError } from "./Errors.js";
import { GeminiGenerateContentResponse } from "./types.js";
import { GeminiChatUtils } from "./ChatUtils.js";

export class GeminiStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(request: ChatRequest): AsyncGenerator<ChatChunk> {
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    const url = `${this.baseUrl}/models/${request.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const { contents, systemInstructionParts } = await GeminiChatUtils.convertMessages(request.messages);

    const generationConfig: any = {
      temperature: temperature ?? undefined,
      maxOutputTokens: request.max_tokens,
    };

    if (request.response_format?.type === "json_object") {
      generationConfig.responseMimeType = "application/json";
    } else if (request.response_format?.type === "json_schema") {
      generationConfig.responseMimeType = "application/json";
      if (request.response_format.json_schema?.schema) {
        generationConfig.responseSchema = this.sanitizeSchema(request.response_format.json_schema.schema);
      }
    }

    const payload: any = {
      contents,
      generationConfig,
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
            const parts = json.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                yield { content: part.text };
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  private sanitizeSchema(schema: any): any {
    if (typeof schema !== "object" || schema === null) return schema;
    
    const sanitized = { ...schema };
    
    // Remove unsupported fields
    delete sanitized.additionalProperties;
    delete sanitized.$schema;
    delete sanitized.$id;
    delete sanitized.definitions;
    
    // Recursively sanitize
    if (sanitized.properties) {
      for (const key in sanitized.properties) {
        sanitized.properties[key] = this.sanitizeSchema(sanitized.properties[key]);
      }
    }
    
    if (sanitized.items) {
      sanitized.items = this.sanitizeSchema(sanitized.items);
    }
    
    return sanitized;
  }
}
