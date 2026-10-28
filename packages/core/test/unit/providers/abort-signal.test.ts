import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ChatRequest } from "../../../src/providers/Provider.js";
import { AnthropicChat } from "../../../src/providers/anthropic/Chat.js";
import { BedrockChat } from "../../../src/providers/bedrock/Chat.js";
import { DeepSeekChat } from "../../../src/providers/deepseek/Chat.js";
import { GeminiChat } from "../../../src/providers/gemini/Chat.js";
import { MistralChat } from "../../../src/providers/mistral/Chat.js";
import { OpenAIChat } from "../../../src/providers/openai/Chat.js";
import { XAIChat } from "../../../src/providers/xai/Chat.js";

const handlers: [string, { execute(request: ChatRequest): Promise<unknown> }, string][] = [
  ["Anthropic", new AnthropicChat("https://api.test", "key"), "claude-sonnet-4-5"],
  ["Bedrock", new BedrockChat({ region: "us-east-1", apiKey: "key" }), "amazon.nova-lite-v1:0"],
  ["DeepSeek", new DeepSeekChat("https://api.test", "key"), "deepseek-chat"],
  ["Gemini", new GeminiChat("https://api.test", "key"), "gemini-2.5-flash"],
  ["Mistral", new MistralChat("https://api.test", "key"), "mistral-small-latest"],
  ["OpenAI", new OpenAIChat("https://api.test", "key"), "gpt-4o"],
  ["xAI", new XAIChat("https://api.test", "key"), "grok-4"]
];

describe("abort signal on non-streaming requests", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("stop after the request")));
  });

  it.each(handlers)(
    "%s passes the signal to fetch and not into the body",
    async (_, handler, model) => {
      const signal = new AbortController().signal;

      await handler
        .execute({ model, messages: [{ role: "user", content: "Hi" }], signal })
        .catch(() => {});

      const [, init] = (fetch as unknown as Mock).mock.calls[0] as [string, RequestInit];
      expect(init.signal).toBe(signal);
      expect(String(init.body)).not.toContain('"signal"');
    }
  );
});
