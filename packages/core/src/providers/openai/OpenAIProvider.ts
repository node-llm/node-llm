import { Provider, ChatRequest, ChatResponse } from "../Provider.js";
import { OpenAIChatResponse } from "./types.js";

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class OpenAIProvider implements Provider {
  private readonly baseUrl: string;

  constructor(private readonly options: OpenAIProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const body: any = {
      model: request.model,
      messages: request.messages,
    };

    if (request.tools) {
      body.tools = request.tools;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI error (${response.status}): ${errorText}`
      );
    }

    const json = (await response.json()) as OpenAIChatResponse;

    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const tool_calls = message?.tool_calls;

    if (!content && !tool_calls) {
      throw new Error("OpenAI returned empty response");
    }

    return { content, tool_calls };
  }

  async *stream(request: ChatRequest) {
    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: true,
        }),
      }
    );

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") return;

        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;

        if (delta) {
          yield { content: delta };
        }
      }
    }
  }
}
