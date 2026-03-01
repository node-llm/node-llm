import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { MistralChat } from "../../../../src/providers/mistral/Chat.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("MistralChat", () => {
  const baseUrl = "https://api.test";
  const apiKey = "test-key";
  let chat: MistralChat;

  beforeEach(() => {
    chat = new MistralChat(baseUrl, apiKey);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should make a correct POST request", async () => {
    const mockResponse = {
      id: "msg_123",
      choices: [
        {
          message: { content: "Hello world" },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15
      }
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const request = {
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "Hi" }]
    };

    const response = await chat.execute(request as ChatRequest);

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/chat/completions`,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: expect.stringContaining('"messages"')
      })
    );

    expect(response.content).toBe("Hello world");
    expect(response.usage).toEqual({
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15,
      cached_tokens: undefined,
      cache_creation_tokens: undefined,
      cost: expect.any(Number),
      input_cost: expect.any(Number),
      output_cost: expect.any(Number)
    });
  });

  it("should handle tool calls in response", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: {
                  name: "get_weather",
                  arguments: '{"location":"Paris"}'
                }
              }
            ]
          },
          finish_reason: "tool_calls"
        }
      ],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const response = await chat.execute({
      model: "mistral-large-latest",
      messages: []
    } as ChatRequest);

    expect(response.tool_calls).toHaveLength(1);
    expect(response.tool_calls![0].function.name).toBe("get_weather");
  });

  it("should handle response format for JSON mode", async () => {
    const mockResponse = {
      choices: [
        {
          message: { content: '{"answer": 42}' },
          finish_reason: "stop"
        }
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };

    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const request = {
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "Answer with JSON" }],
      response_format: { type: "json_object" }
    };

    const response = await chat.execute(request as ChatRequest);

    expect(response.content).toBe('{"answer": 42}');
  });

  it("should handle API errors", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: "Invalid API key" })
    });

    await expect(
      chat.execute({
        model: "mistral-large-latest",
        messages: []
      } as ChatRequest)
    ).rejects.toThrow();
  });
});
