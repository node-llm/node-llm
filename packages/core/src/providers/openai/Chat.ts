import { ChatRequest, ChatResponse, Usage } from "../Provider.js";
import { OpenAIChatResponse } from "./types.js";
import { Capabilities } from "./Capabilities.js";
import { handleOpenAIError } from "./Errors.js";
import { ModelRegistry } from "../../models/ModelRegistry.js";

export class OpenAIChat {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const temperature = Capabilities.normalizeTemperature(request.temperature, request.model);
    
    const { model, messages, tools, temperature: _, max_tokens, response_format, headers, ...rest } = request;

    const body: any = {
      model,
      messages,
      ...rest
    };

    if (temperature !== undefined && temperature !== null) body.temperature = temperature;
    if (max_tokens) body.max_tokens = max_tokens;
    if (tools) body.tools = tools;
    if (response_format) body.response_format = response_format;

    if (process.env.NODELLM_DEBUG === "true") {
      console.log(`[OpenAI Request] ${JSON.stringify(body, null, 2)}`);
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

    const json = (await response.json()) as OpenAIChatResponse;
    const message = json.choices[0]?.message;
    const content = message?.content ?? null;
    const tool_calls = message?.tool_calls;

    const usage = json.usage ? {
      input_tokens: json.usage.prompt_tokens,
      output_tokens: json.usage.completion_tokens,
      total_tokens: json.usage.total_tokens,
      cached_tokens: json.usage.prompt_tokens_details?.cached_tokens,
    } : undefined;

    if (!content && !tool_calls) {
      throw new Error("OpenAI returned empty response");
    }

    const calculatedUsage = usage ? ModelRegistry.calculateCost(usage, model, "openai") : undefined;

    return { content, tool_calls, usage: calculatedUsage };
  }
}
