import { ChatRequest, ChatChunk } from "../Provider.js";
import { handleAnthropicError } from "./Errors.js";
import { buildMessageRequest, hasPdf } from "./Utils.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

export class AnthropicStreaming {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async *execute(request: ChatRequest, controller?: AbortController): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const model = request.model;
    const body = buildMessageRequest(request, true);

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...request.headers
    };

    if (hasPdf(body)) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    let done = false;
    // Track tool calls being built across chunks
    const toolCallsMap = new Map<
      number,
      { id: string; type: string; function: { name: string; arguments: string } }
    >();
    let currentBlockIndex = -1;

    try {
      const url = `${this.baseUrl}/messages`;
      logger.logRequest("Anthropic", "POST", url, body);

      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
          signal: abortController.signal
        },
        request.requestTimeout
      );

      if (!response.ok) {
        await handleAnthropicError(response, model);
      }

      logger.debug("Anthropic streaming started", {
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
        if (readerDone) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          let trimmed = line.trim();

          // Handle carriage returns
          if (trimmed.endsWith("\r")) {
            trimmed = trimmed.substring(0, trimmed.length - 1);
          }

          if (!trimmed.startsWith("event: ")) continue;

          // Format is:
          // event: type
          // data: json

          const parts = trimmed.split("\n");
          const eventLine = parts[0];
          const dataLine = parts.find((p) => p.startsWith("data: "));

          if (!dataLine || !eventLine) continue;

          const eventType = eventLine.replace("event: ", "").trim();
          const dataStr = dataLine.replace("data: ", "").trim();

          try {
            const data = JSON.parse(dataStr);

            // Handle different event types from Anthropic
            if (eventType === "content_block_start") {
              // Track the block index for tool use
              if (data.content_block?.type === "tool_use") {
                currentBlockIndex = data.index;
                toolCallsMap.set(currentBlockIndex, {
                  id: data.content_block.id,
                  type: "function",
                  function: {
                    name: data.content_block.name,
                    arguments: ""
                  }
                });
              }
            } else if (eventType === "content_block_delta") {
              if (data.delta && data.delta.type === "text_delta") {
                yield { content: data.delta.text };
              } else if (data.delta && data.delta.type === "thinking_delta") {
                yield { content: "", thinking: { text: data.delta.thinking } };
              } else if (data.delta && data.delta.type === "signature_delta") {
                yield { content: "", thinking: { signature: data.delta.signature } };
              } else if (data.delta && data.delta.type === "input_json_delta") {
                // Accumulate tool arguments
                const index = data.index;
                if (toolCallsMap.has(index)) {
                  const toolCall = toolCallsMap.get(index)!;
                  toolCall.function.arguments += data.delta.partial_json;
                }
              }
            } else if (eventType === "content_block_stop") {
              // Block finished
            } else if (eventType === "message_start") {
              if (data.message?.usage) {
                const usage = {
                  input_tokens: data.message.usage.input_tokens,
                  output_tokens: data.message.usage.output_tokens,
                  total_tokens: data.message.usage.input_tokens + data.message.usage.output_tokens
                };
                yield { content: "", usage };
              }
            } else if (eventType === "message_delta") {
              // Update usage
              if (data.usage) {
                const usage = {
                  input_tokens: 0, // Delta usually only contains output
                  output_tokens: data.usage.output_tokens,
                  total_tokens: data.usage.output_tokens
                };
                yield { content: "", usage };
              }

              if (data.delta?.stop_reason === "end_turn" && toolCallsMap.size > 0) {
                // Yield accumulated tool calls
                const toolCalls = Array.from(toolCallsMap.values()).map((tc) => ({
                  id: tc.id,
                  type: "function" as const,
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                  }
                }));
                yield { content: "", tool_calls: toolCalls, done: true };
              }
            } else if (eventType === "message_stop") {
              done = true;
            } else if (eventType === "error") {
              throw new Error(`Stream error: ${data.error?.message}`);
            }
          } catch (e) {
            // Re-throw errors
            if (e instanceof Error && e.message.startsWith("Stream error")) throw e;
            // Ignore parse errors
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
}
