import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider } from "../../../src/providers/Provider.js";

describe("Custom HTTP Headers", () => {
  it("passes headers to the provider via withRequestOptions", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model");

    chat.withRequestOptions({
      headers: {
        "X-Custom-Auth": "secret-token",
        "Helicone-Auth": "Bearer helicone-key"
      }
    });

    await chat.ask("Hello");

    expect(mockChat).toHaveBeenCalledTimes(1);
    const request = mockChat.mock.calls[0][0];
    expect(request.headers).toEqual({
      "X-Custom-Auth": "secret-token",
      "Helicone-Auth": "Bearer helicone-key"
    });
  });

  it("merges headers from multiple sources", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model");

    // Set base headers
    chat.withRequestOptions({ headers: { Base: "1" } });

    // Add more
    chat.withRequestOptions({ headers: { Extra: "2" } });

    await chat.ask("Hello");

    expect(mockChat).toHaveBeenCalledTimes(1);
    const request = mockChat.mock.calls[0][0];
    expect(request.headers).toMatchObject({
      Base: "1",
      Extra: "2"
    });
  });

  it("prioritizes headers passed directly to ask options", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model"); // Invalid provider but mocked

    chat.withRequestOptions({ headers: { OverrideMe: "original" } });

    await chat.ask("Hello", {
      headers: { OverrideMe: "new-value" }
    });

    expect(mockChat).toHaveBeenCalledTimes(1);
    const request = mockChat.mock.calls[0][0];
    expect(request.headers["OverrideMe"]).toBe("new-value");
  });
});
