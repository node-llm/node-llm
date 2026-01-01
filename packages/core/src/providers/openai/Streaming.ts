import { ChatRequest, ChatChunk } from "../Provider.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";

export class OpenAIStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(request: ChatRequest): AsyncGenerator<ChatChunk> {
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

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...request.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model);
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

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // Keep the last incomplete part in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.replace("data: ", "").trim();
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;

          if (delta) {
            yield { content: delta };
          }
        } catch (e) {
          // Ignore parse errors for now, or log them
          // console.warn("JSON parse error in stream:", e);
        }
      }
    }
  }
}
