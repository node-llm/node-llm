import { ChatRequest, ChatChunk } from "../Provider.js";
import { APIError } from "../../errors/index.js";

export class DeepSeekStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(
    request: ChatRequest,
    controller?: AbortController
  ): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const { model, messages, tools, max_tokens, response_format, headers, ...rest } = request;

    const body: any = {
      model,
      messages,
      stream: true,
      ...rest
    };

    if (max_tokens) body.max_tokens = max_tokens;
    if (tools && tools.length > 0) body.tools = tools;
    if (response_format) body.response_format = response_format;

    let done = false;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

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
          if (trimmed.endsWith('\r')) {
            trimmed = trimmed.substring(0, trimmed.length - 1);
          }

          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.replace("data: ", "").trim();
          if (data === "[DONE]") {
            done = true;
            return;
          }

          try {
            const json = JSON.parse(data);
            
            // Check for errors in the data
            if (json.error) {
              throw new APIError(
                "DeepSeek",
                response.status,
                json.error.message || "Stream error",
              );
            }

            const deltaContent = json.choices?.[0]?.delta?.content;
            const deltaReasoning = json.choices?.[0]?.delta?.reasoning_content;
            
            if (deltaContent || deltaReasoning) {
              yield { 
                content: deltaContent || "",
                reasoning: deltaReasoning || "" 
              };
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
