import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicChat } from "../../../../src/providers/anthropic/Chat.ts";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("AnthropicChat", () => {
  const baseUrl = "https://api.anthropic.com/v1";
  const apiKey = "test-key";
  let chat: AnthropicChat;

  beforeEach(() => {
    chat = new AnthropicChat(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should execute a chat request", async () => {
    const request: ChatRequest = {
      model: "claude-3-haiku-20240307",
      messages: [{ role: "user", content: "Hello" }]
    };

    const mockResponse = {
      content: [{ type: "text", text: "Hi!" }],
      usage: { input_tokens: 10, output_tokens: 5 }
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(`${baseUrl}/messages`, expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"messages":[{"role":"user","content":"Hello"}]')
    }));
    expect(result.content).toBe("Hi!");
    expect(result.usage?.total_tokens).toBe(15);
  });

  it("should handle tool calls in response", async () => {
    const request: ChatRequest = {
      model: "claude-3-haiku-20240307",
      messages: [{ role: "user", content: "What is the weather?" }]
    };

    const mockResponse = {
      content: [
        { type: "text", text: "Let me check." },
        { type: "tool_use", id: "call1", name: "get_weather", input: { city: "London" } }
      ],
      usage: { input_tokens: 15, output_tokens: 20 }
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(result.content).toBe("Let me check.");
    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls![0].function.name).toBe("get_weather");
    expect(JSON.parse(result.tool_calls![0].function.arguments)).toEqual({ city: "London" });
  });

  it("should handle error responses", async () => {
    const request: ChatRequest = {
      model: "invalid-model",
      messages: [{ role: "user", content: "Hello" }]
    };

    (fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: "Invalid model" } })
    });

    await expect(chat.execute(request)).rejects.toThrow("Invalid model");
  });

  it("should add PDF beta header if document present", async () => {
    const request: ChatRequest = {
      model: "claude-3-5-sonnet-20240620",
      messages: [{ 
        role: "user", 
        content: [{ type: "image_url", image_url: { url: "data:application/pdf;base64,JVBERi0xLjEK" } }] 
      } as any]
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [] })
    });

    await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({
        "anthropic-beta": "pdfs-2024-09-25"
      })
    }));
  });
});
