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
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI error (${response.status}): ${errorText}`
      );
    }

    const json = (await response.json()) as OpenAIChatResponse;

    const content = json.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    return { content };
  }
}
