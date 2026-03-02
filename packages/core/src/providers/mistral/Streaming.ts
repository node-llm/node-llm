import { ChatRequest, ChatChunk } from "../Provider.js";
import { APIError } from "../../errors/index.js";
import { logger } from "../../utils/logger.js";
import { handleMistralError } from "./Errors.js";
import { mapSystemMessages } from "../utils.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

export class MistralStreaming {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async *execute(request: ChatRequest, controller?: AbortController): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const {
      model,
      messages,
      tools,
      max_tokens,
      response_format,
      thinking: _thinking,
      headers: _headers,
      requestTimeout,
      signal: _signal,
      ...rest
    } = request;

    const mappedMessages = mapSystemMessages(messages, false);

    // Sanitize messages - remove internal properties that Mistral API doesn't accept
    const sanitizedMessages = mappedMessages.map((msg) => {
      const m = msg as unknown as Record<string, unknown>;
      const { role, content, tool_calls, tool_call_id, name } = m;
      const clean: Record<string, unknown> = { role, content };
      if (tool_calls) clean.tool_calls = tool_calls;
      if (tool_call_id) clean.tool_call_id = tool_call_id;
      if (name) clean.name = name;
      return clean;
    });

    const body: Record<string, unknown> = {
      model,
      messages: sanitizedMessages,
      stream: true,
      ...rest
    };

    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;
    if (response_format) body.response_format = response_format;

    let done = false;
    // Track tool calls being built across chunks
    const toolCallsMap = new Map<
      number,
      { id: string; type: string; function: { name: string; arguments: string } }
    >();

    try {
      const url = `${this.baseUrl}/chat/completions`;
      logger.logRequest("Mistral", "POST", url, body);

      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...request.headers
          },
          body: JSON.stringify(body),
          signal: abortController.signal
        },
        requestTimeout
      );

      if (!response.ok) {
        await handleMistralError(response, model);
      }

      logger.debug("Mistral streaming started", {
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

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          let trimmed = line.trim();

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

              yield {
                content: "",
                tool_calls: toolCalls,
                done: true
              };
            } else {
              yield { content: "", done: true };
            }
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            // Handle usage in final chunk
            if (parsed.usage) {
              yield {
                content: "",
                usage: {
                  input_tokens: parsed.usage.prompt_tokens ?? 0,
                  output_tokens: parsed.usage.completion_tokens ?? 0,
                  total_tokens: parsed.usage.total_tokens ?? 0
                },
                done: false
              };
              continue;
            }

            // Handle tool calls
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const index = tc.index ?? 0;
                let existing = toolCallsMap.get(index);

                if (!existing) {
                  existing = {
                    id: tc.id || "",
                    type: tc.type || "function",
                    function: {
                      name: tc.function?.name || "",
                      arguments: ""
                    }
                  };
                  toolCallsMap.set(index, existing);
                }

                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.function.name = tc.function.name;
                if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
              }
              continue;
            }

            // Handle content
            const content = delta?.content || "";
            if (content) {
              yield {
                content,
                done: false,
                finish_reason: choice?.finish_reason ?? null
              };
            }
          } catch {
            // Skip malformed JSON
            logger.debug("Mistral streaming: failed to parse chunk", { data });
          }
        }
      }

      // Final chunk if not already sent
      if (!done) {
        if (toolCallsMap.size > 0) {
          const toolCalls = Array.from(toolCallsMap.values()).map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments
            }
          }));

          yield {
            content: "",
            tool_calls: toolCalls,
            done: true
          };
        } else {
          yield { content: "", done: true };
        }
      }
    } catch (error) {
      if (error instanceof APIError) throw error;

      const isAbort =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("aborted"));

      if (isAbort) {
        yield { content: "", done: true };
        return;
      }

      throw error;
    }
  }
}
