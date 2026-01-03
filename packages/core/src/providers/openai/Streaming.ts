import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";
import { APIError } from "../../errors/index.js";
import { logger } from "../../utils/logger.js";

export class OpenAIStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(
    request: ChatRequest,
    controller?: AbortController
  ): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    
    const body: any = {
      model: request.model,
      messages: request.messages,
      stream: true,
    };

    if (temperature !== undefined && temperature !== null) {
      body.temperature = temperature;
    }

    if (request.max_tokens) {
      body.max_tokens = request.max_tokens;
    }

    if (request.response_format) {
      body.response_format = request.response_format;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    let done = false;
    // Track tool calls being built across chunks
    const toolCallsMap = new Map<number, any>();

    try {
      const url = buildUrl(this.baseUrl, '/chat/completions');
      logger.logRequest("OpenAI", "POST", url, body);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...request.headers,
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        await handleOpenAIError(response, request.model);
      }

      logger.debug("OpenAI streaming started", { status: response.status, statusText: response.statusText });

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep the last incomplete part in the buffer

        for (const line of lines) {
          let trimmed = line.trim();
          
          // Handle carriage returns
          if (trimmed.endsWith('\r')) {
            trimmed = trimmed.substring(0, trimmed.length - 1);
          }

          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.replace("data: ", "").trim();
          if (data === "[DONE]") {
            done = true;
            
            // Yield final tool calls if any were accumulated
            if (toolCallsMap.size > 0) {
              const toolCalls = Array.from(toolCallsMap.values()).map(tc => ({
                id: tc.id,
                type: "function" as const,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments
                }
              }));
              yield { content: "", tool_calls: toolCalls, done: true };
            }
            
            return;
          }

          try {
            const json = JSON.parse(data);
            
            // Check for errors in the data
            if (json.error) {
              throw new APIError(
                "OpenAI",
                response.status,
                json.error.message || "Stream error",
              );
            }

            const delta = json.choices?.[0]?.delta;
            
            // Handle content delta
            if (delta?.content) {
              yield { content: delta.content };
            }

            // Handle tool calls delta
            if (delta?.tool_calls) {
              for (const toolCallDelta of delta.tool_calls) {
                const index = toolCallDelta.index;
                
                if (!toolCallsMap.has(index)) {
                  toolCallsMap.set(index, {
                    id: toolCallDelta.id || "",
                    type: "function",
                    function: {
                      name: toolCallDelta.function?.name || "",
                      arguments: toolCallDelta.function?.arguments || ""
                    }
                  });
                } else {
                  const existing = toolCallsMap.get(index)!;
                  if (toolCallDelta.id) existing.id = toolCallDelta.id;
                  if (toolCallDelta.function?.name) {
                    existing.function.name += toolCallDelta.function.name;
                  }
                  if (toolCallDelta.function?.arguments) {
                    existing.function.arguments += toolCallDelta.function.arguments;
                  }
                }
              }
            }
          } catch (e) {
            // Re-throw APIError
            if (e instanceof APIError) throw e;
            // Ignore other parse errors
          }
        }
      }
      done = true;
    } catch (e) {
      // Graceful exit on abort
      if (e instanceof Error && e.name === 'AbortError') {
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
}
