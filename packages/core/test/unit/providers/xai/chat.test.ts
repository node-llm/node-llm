import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { XAIChat } from "../../../../src/providers/xai/Chat.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("XAIChat", () => {
  const baseUrl = "https://api.test";
  const apiKey = "test-key";
  let chat: XAIChat;

  beforeEach(() => {
    chat = new XAIChat(baseUrl, apiKey);
    // Mock global fetch
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
      model: "grok-2",
      messages: [{ role: "user", content: "Hi" }]
    };

    const response = await chat.execute(request as ChatRequest);

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/chat/completions`,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: expect.stringContaining('"messages":[{"role":"user","content":"Hi"}]')
      })
    );

    expect(response.content).toBe("Hello world");
    expect(response.usage).toEqual({
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15
    });
  });

  it("should capture tool calls if present", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_123",
                type: "function",
                function: { name: "get_weather", arguments: "{}" }
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
      model: "grok-2",
      messages: []
    } as ChatRequest);

    expect(response.content).toBe(null);
    expect(response.tool_calls).toEqual([
      {
        id: "call_123",
        type: "function",
        function: { name: "get_weather", arguments: "{}" }
      }
    ]);
  });

  it("should handle API errors", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Bad Request" } })
    });

    await expect(chat.execute({ model: "grok-2", messages: [] } as ChatRequest)).rejects.toThrow(
      "Bad Request"
    );
  });
});
