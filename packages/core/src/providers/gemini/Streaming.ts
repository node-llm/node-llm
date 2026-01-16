import { ChatRequest, ChatChunk } from "../Provider.js";
import { ToolCall } from "../../chat/Tool.js";
import { Capabilities } from "./Capabilities.js";
import { handleGeminiError } from "./Errors.js";
import { GeminiGenerateContentResponse } from "./types.js";
import { GeminiChatUtils } from "./ChatUtils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

export class GeminiStreaming {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async *execute(request: ChatRequest, controller?: AbortController): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    const url = `${this.baseUrl}/models/${request.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const { contents, systemInstructionParts } = await GeminiChatUtils.convertMessages(
      request.messages
    );

    const generationConfig: Record<string, unknown> = {
      temperature: temperature ?? undefined,
      maxOutputTokens: request.max_tokens
    };

    if (request.response_format?.type === "json_object") {
      generationConfig.responseMimeType = "application/json";
    } else if (request.response_format?.type === "json_schema") {
      generationConfig.responseMimeType = "application/json";
      if (request.response_format.json_schema?.schema) {
        generationConfig.responseSchema = this.sanitizeSchema(
          request.response_format.json_schema.schema
        );
      }
    }

    const payload: Record<string, unknown> = {
      contents,
      generationConfig
    };

    if (systemInstructionParts.length > 0) {
      payload.systemInstruction = { parts: systemInstructionParts };
    }

    if (request.tools && request.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          }))
        }
      ];
    }

    let done = false;
    const toolCalls: ToolCall[] = [];

    try {
      logger.logRequest("Gemini", "POST", url, payload);

      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
        },
        request.requestTimeout
      );

      if (!response.ok) {
        await handleGeminiError(response, request.model);
      }

      logger.debug("Gemini streaming started", {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) {
          // Yield tool calls if any were collected
          if (toolCalls.length > 0) {
            yield { content: "", tool_calls: toolCalls, done: true };
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let lineEnd;
        while ((lineEnd = buffer.indexOf("\n")) !== -1) {
          let line = buffer.substring(0, lineEnd).trim();
          buffer = buffer.substring(lineEnd + 1);

          // Handle carriage returns
          if (line.endsWith("\r")) {
            line = line.substring(0, line.length - 1);
          }

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
                // Handle function calls
                if (part.functionCall) {
                  toolCalls.push({
                    id: part.functionCall.name, // Gemini uses name as ID
                    type: "function" as const,
                    function: {
                      name: part.functionCall.name,
                      arguments: JSON.stringify(part.functionCall.args || {})
                    }
                  });
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
      done = true;
    } catch (e) {
      // Graceful exit on abort
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      throw e;
    } finally {
      // Cleanup: abort if user breaks early
      if (!done) {
        abortController.abort();
      }
    }
  }

  private sanitizeSchema(schema: unknown): unknown {
    if (typeof schema !== "object" || schema === null) return schema;

    const sanitized = { ...(schema as Record<string, unknown>) };

    // Remove unsupported fields
    delete sanitized.additionalProperties;
    delete sanitized.$schema;
    delete sanitized.$id;
    delete sanitized.definitions;

    // Recursively sanitize
    if (sanitized.properties && typeof sanitized.properties === "object") {
      const props = sanitized.properties as Record<string, unknown>;
      for (const key in props) {
        props[key] = this.sanitizeSchema(props[key]);
      }
    }

    if (sanitized.items) {
      sanitized.items = this.sanitizeSchema(sanitized.items);
    }

    return sanitized;
  }
}
