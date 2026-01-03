import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleAnthropicError } from "./Errors.js";
import { formatSystemPrompt, formatMessages } from "./Utils.js";
import { AnthropicMessageRequest } from "./types.js";

export class AnthropicStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(
    request: ChatRequest,
    controller?: AbortController
  ): AsyncGenerator<ChatChunk> {
    const abortController = controller || new AbortController();
    const model = request.model;
    const maxTokens = request.max_tokens || Capabilities.getMaxOutputTokens(model) || 4096;
    
    const systemPrompt = formatSystemPrompt(request.messages);
    const messages = formatMessages(request.messages);

    let system = systemPrompt;
    if (request.response_format) {
      let schemaText = "";
      if (request.response_format.type === "json_schema" && request.response_format.json_schema?.schema) {
        schemaText = "\nSchema:\n" + JSON.stringify(request.response_format.json_schema.schema, null, 2);
      }
      const instruction = `CRITICAL: Respond ONLY with a valid JSON object matching the requested schema.${schemaText}\n\nDo not include any other text or explanation.`;
      system = system ? `${system}\n\n${instruction}` : instruction;
    }

    const body: AnthropicMessageRequest = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      system: system,
      stream: true,
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
        body.tools = request.tools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          input_schema: tool.function.parameters
        }));
    }

    // Check if any message contains PDF content to add beta header
    const hasPdf = messages.some(msg => 
      Array.isArray(msg.content) && msg.content.some(block => block.type === "document")
    );

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...request.headers,
    };

    if (hasPdf) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }


    let done = false;

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        await handleAnthropicError(response, model);
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

          if (!trimmed.startsWith("event: ")) continue;
          
          // Format is:
          // event: type
          // data: json
          
          const parts = trimmed.split("\n");
          const eventLine = parts[0];
          const dataLine = parts.find(p => p.startsWith("data: "));
          
          if (!dataLine || !eventLine) continue;

          const eventType = eventLine.replace("event: ", "").trim();
          const dataStr = dataLine.replace("data: ", "").trim();

          try {
            const data = JSON.parse(dataStr);
            
            // Handle different event types from Anthropic
            if (eventType === "content_block_delta") {
              if (data.delta && data.delta.type === "text_delta") {
                yield { content: data.delta.text };
              }
            }
            else if (eventType === "message_start") {
              // Could extract initial usage here
            }
            else if (eventType === "message_delta") {
              // Update usage or stop reason
            }
            else if (eventType === "error") {
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
