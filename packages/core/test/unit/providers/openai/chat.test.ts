import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIChat } from "../../../../src/providers/openai/Chat.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("OpenAIChat", () => {
  const baseUrl = "https://api.openai.com/v1";
  const apiKey = "test-key";
  let chat: OpenAIChat;

  beforeEach(() => {
    chat = new OpenAIChat(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should execute a chat request", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }]
    };

    const mockResponse = {
      choices: [{ message: { content: "Hi!" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/chat/completions`, expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Authorization": "Bearer test-key" })
    }));
    expect(result.content).toBe("Hi!");
    expect(result.usage?.total_tokens).toBe(15);
  });

  it("should handle tool calls in response", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Weather?" }]
    };

    const mockResponse = {
      choices: [{ 
        message: { 
          content: null, 
          tool_calls: [{ id: "call1", type: "function", function: { name: "get_weather", arguments: "{}" } }] 
        } 
      }]
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(result.content).toBeNull();
    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls![0].function.name).toBe("get_weather");
  });

  it("should throw error on empty response", async () => {
    const request: ChatRequest = { model: "gpt-4o", messages: [] };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: {} }] })
    });

    await expect(chat.execute(request)).rejects.toThrow("OpenAI returned empty response");
  });
});
