import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";

describe("Chat", () => {
  it("accumulates messages and returns provider response", async () => {
    const provider = new FakeProvider(["Hello from assistant", "Second reply"]);

    const chat = new Chat(provider, "test-model", {
      systemPrompt: "You are a test assistant"
    });

    const reply1 = await chat.ask("Hi");
    const response = await chat.ask("What is the speed of light?");

    expect(String(reply1)).toBe("Hello from assistant");
    expect(String(response)).toBe("Second reply");

    expect(chat.history).toHaveLength(5);
    expect(chat.history[0]).toMatchObject({ role: "system", content: "You are a test assistant" });
    expect(chat.history[1]?.role).toBe("user");
    expect(chat.history[2]?.role).toBe("assistant");
    expect(String(chat.history[2]?.content)).toBe("Hello from assistant");
  });

  it("allows switching models mid-conversation", async () => {
    const provider = new FakeProvider(["Reply 1", "Reply 2"]);
    const chat = new Chat(provider, "model-1");

    await chat.ask("Q1");

    chat.withModel("model-2");
    await chat.ask("Q2");
  });
});
