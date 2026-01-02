import { ChatRequest, ChatChunk } from "../Provider.js";

export class DeepSeekStreaming {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async *execute(request: ChatRequest): AsyncGenerator<ChatChunk> {
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
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    // @ts-ignore
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; 

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
             // ignore
        }
      }
    }
  }
}
