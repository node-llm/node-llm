import { describe, it, expect } from "vitest";
import { Chat } from "../src/chat/Chat.js";
import { FakeProvider } from "./fake-provider.js";

describe("Chat", () => {
  it("accumulates messages and returns provider response", async () => {
    const provider = new FakeProvider([
      "Hello from assistant",
      "Second reply",
    ]);

    const chat = new Chat(provider, "test-model", {
      systemPrompt: "You are a test assistant",
    });

    const reply1 = await chat.ask("Hi");
    const reply2 = await chat.ask("How are you?");

    expect(reply1).toBe("Hello from assistant");
    expect(reply2).toBe("Second reply");

    expect(chat.history).toEqual([
      { role: "system", content: "You are a test assistant" },
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello from assistant" },
      { role: "user", content: "How are you?" },
      { role: "assistant", content: "Second reply" },
    ]);
  });
});
