import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider } from "../../../src/providers/Provider.js";

describe("Chat Temperature", () => {
  it("passes temperature to the provider", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model");

    // Set temperature
    chat.withTemperature(0.7);

    await chat.ask("Hello");

    expect(mockChat).toHaveBeenCalledTimes(1);
    const request = mockChat.mock.calls[0][0];
    expect(request.temperature).toBe(0.7);
  });

  it("can be overridden in ask options", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model");

    chat.withTemperature(0.5);

    // Override in ask
    await chat.ask("Hello", { temperature: 0.1 });

    const request = mockChat.mock.calls[0][0];
    expect(request.temperature).toBe(0.1);
  });

  it("supports chaining", async () => {
    const mockChat = vi.fn().mockResolvedValue({ content: "Response" });
    const provider: Provider = {
      chat: mockChat
    } as unknown as Provider;

    const chat = new Chat(provider, "test-model");

    // Chaining
    chat.withTemperature(0.9).withSystemPrompt("System");

    await chat.ask("Hello");

    const request = mockChat.mock.calls[0][0];
    expect(request.temperature).toBe(0.9);
    expect(request.messages[0].content).toBe("System");
  });
});
