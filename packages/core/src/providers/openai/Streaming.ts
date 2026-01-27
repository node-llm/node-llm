import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { buildUrl } from "./utils.js";
import { APIError } from "../../errors/index.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

import { OpenAIProvider } from "./OpenAIProvider.js";
import { mapSystemMessages } from "../utils.js";

export class OpenAIStreaming {
  private readonly baseUrl: string;

  constructor(
    private readonly providerOrUrl: OpenAIProvider | string,
    private readonly apiKey: string
  ) {
    this.baseUrl = typeof providerOrUrl === "string" ? providerOrUrl : providerOrUrl.apiBase();
  }

  async *execute(request: ChatRequest, controller?: AbortController): AsyncGenerator<ChatChunk> {
    const internalController = new AbortController();
    const abortController = controller || internalController;

    const signal = request.signal ? (request.signal as AbortSignal) : abortController.signal;
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);

    const isMainOpenAI = this.baseUrl.includes("api.openai.com");
    const supportsDeveloperRole =
      isMainOpenAI &&
      (typeof this.providerOrUrl === "string"
        ? Capabilities.supportsDeveloperRole(request.model)
        : this.providerOrUrl.capabilities?.supportsDeveloperRole(request.model));

    const mappedMessages = mapSystemMessages(request.messages, !!supportsDeveloperRole);

    const body: Record<string, unknown> = {
      model: request.model,
      messages: mappedMessages,
      stream: true
    };

    if (temperature !== undefined && temperature !== null) {
      body.temperature = temperature;
    }

    if (request.max_tokens) {
      if (Capabilities.needsMaxCompletionTokens(request.model)) {
        body.max_completion_tokens = request.max_tokens;
      } else {
        body.max_tokens = request.max_tokens;
      }
    }

    if (request.response_format) {
      body.response_format = request.response_format;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    if (request.thinking?.effort && request.thinking.effort !== "none") {
      body.reasoning_effort = request.thinking.effort;
    }

    body.stream_options = { include_usage: true };

    let done = false;
    // Track tool calls being built across chunks
    const toolCallsMap = new Map<
      number,
      { id: string; type: string; function: { name: string; arguments: string } }
    >();

    try {
      const url = buildUrl(this.baseUrl, "/chat/completions");
      logger.logRequest("OpenAI", "POST", url, body);

      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...request.headers
          },
          body: JSON.stringify(body),
          signal
        },
        request.requestTimeout
      );

      if (!response.ok) {
        await handleOpenAIError(response, request.model);
      }

      logger.debug("OpenAI streaming started", {
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
        buffer = lines.pop() || ""; // Keep the last incomplete part in the buffer

        for (const line of lines) {
          let trimmed = line.trim();

          // Handle carriage returns
          if (trimmed.endsWith("\r")) {
            trimmed = trimmed.substring(0, trimmed.length - 1);
          }

          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.replace("data: ", "").trim();
          if (data === "[DONE]") {
            done = true;

            // Yield final tool calls if any were accumulated
            if (toolCallsMap.size > 0) {
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

            return;
          }

          try {
            const json = JSON.parse(data);

            // Check for errors in the data
            if (json.error) {
              throw new APIError("OpenAI", response.status, json.error.message || "Stream error");
            }

            const delta = json.choices?.[0]?.delta;

            // Handle content delta
            if (delta?.content) {
              yield { content: delta.content };
            }

            // Handle reasoning content delta
            if (delta?.reasoning_content) {
              yield { content: "", thinking: { text: delta.reasoning_content } };
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

            // Handle usage (usually in the special chunk when stream_options.include_usage: true)
            if (json.usage) {
              const usage = {
                input_tokens: json.usage.prompt_tokens,
                output_tokens: json.usage.completion_tokens,
                total_tokens: json.usage.total_tokens
              };
              yield { content: "", usage };
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
