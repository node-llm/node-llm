import { describe, it, expect, vi, afterEach } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider } from "../../../src/providers/Provider.js";
import { Tool } from "../../../src/chat/Tool.js";
import { z } from "zod";
import { FakeProvider } from "../../fake-provider.js";

// A provider whose models reject a temperature, as Claude Opus 4.7 and later do.
const withoutTemperature = (provider: FakeProvider) =>
  Object.assign(provider, {
    capabilities: { supportsTools: () => true, supportsTemperature: () => false }
  }) as unknown as Provider & FakeProvider;

class LookupTool extends Tool<{ query: string }> {
  name = "lookup";
  description = "Looks something up";
  schema = z.object({ query: z.string() });
  async execute() {
    return "found";
  }
}

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

  describe("for models that reject a temperature", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("sends the request without it", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const provider = withoutTemperature(new FakeProvider(["Response"]));

      await new Chat(provider, "no-temperature-ask").withTemperature(0).ask("Hello");

      expect(provider.lastRequest?.temperature).toBeUndefined();
    });

    it("warns once per model", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const provider = withoutTemperature(new FakeProvider(["One", "Two"]));
      const chat = new Chat(provider, "no-temperature-warn").withTemperature(0);

      await chat.ask("Hello");
      await chat.ask("Again");

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("no-temperature-warn does not accept a temperature")
      );
    });

    it("leaves it out of the requests that follow tool calls", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const provider = withoutTemperature(
        new FakeProvider([
          {
            content: "",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "lookup", arguments: '{"query":"x"}' }
              }
            ]
          },
          "Done"
        ])
      );
      const chat = new Chat(provider, "no-temperature-tools")
        .withTemperature(0)
        .withTool(LookupTool);

      await chat.ask("Look it up");

      expect(provider.lastRequest?.messages.some((m) => m.role === "tool")).toBe(true);
      expect(provider.lastRequest?.temperature).toBeUndefined();
    });

    it("leaves it out of streamed requests", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const provider = withoutTemperature(new FakeProvider(["Streamed reply"]));
      const chat = new Chat(provider, "no-temperature-stream").withTemperature(0);

      for await (const _chunk of chat.stream("Hello")) {
        // drain
      }

      expect(provider.lastRequest?.temperature).toBeUndefined();
    });

    it("still sends it to models that accept one", async () => {
      const provider = Object.assign(new FakeProvider(["Response"]), {
        capabilities: { supportsTemperature: () => true }
      }) as unknown as Provider & FakeProvider;

      await new Chat(provider, "accepts-temperature").withTemperature(0.3).ask("Hello");

      expect(provider.lastRequest?.temperature).toBe(0.3);
    });
  });
});
