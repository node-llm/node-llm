import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { ChatResponseString } from "../../../src/chat/ChatResponse.js";
import { FakeProvider } from "../../fake-provider.js";

describe("Chat Extended Thinking", () => {
  it("passes thinking configuration to the provider", async () => {
    const provider = new FakeProvider([{ content: "Thinking..." }]);
    const chat = new Chat(provider, "test-model");

    await chat.withThinking({ effort: "high", budget: 1000 }).ask("Hello");

    expect(provider.lastRequest?.thinking).toEqual({
      effort: "high",
      budget: 1000
    });
  });

  it("shortcut withEffort works", async () => {
    const provider = new FakeProvider([{ content: "Thinking..." }]);
    const chat = new Chat(provider, "test-model");

    await chat.withEffort("medium").ask("Hello");

    expect(provider.lastRequest?.thinking?.effort).toBe("medium");
  });

  it("captures thinking result from non-streaming response", async () => {
    const provider = new FakeProvider([
      {
        content: "The answer is 42",
        thinking: {
          text: "Let me think... 6 * 7 = 42",
          signature: "sig123",
          tokens: 15
        }
      }
    ]);
    const chat = new Chat(provider, "test-model");

    const response = await chat.ask("What is 6 * 7?");

    expect(response.content).toBe("The answer is 42");
    expect(response.thinking).toBeDefined();
    expect(response.thinking?.text).toBe("Let me think... 6 * 7 = 42");
    expect(response.thinking?.signature).toBe("sig123");
    expect(response.thinking?.tokens).toBe(15);
  });

  it("captures thinking result from streaming response", async () => {
    const provider = new FakeProvider([
      {
        content: "Streaming answer",
        thinking: {
          text: "Thinking in stream...",
          signature: "sig-stream",
          tokens: 20
        }
      }
    ]);
    const chat = new Chat(provider, "test-model");

    const stream = chat.stream("Hello");
    let fullContent = "";
    for await (const chunk of stream) {
      if (chunk.content) fullContent += chunk.content;
    }

    expect(fullContent).toBe("Streaming answer");

    // Check historical message
    expect(chat.history).toHaveLength(2); // user + assistant
    const lastMsg = chat.history[chat.history.length - 1]!;
    expect(lastMsg.role).toBe("assistant");
    const assistantContent = lastMsg.content as ChatResponseString;
    expect(assistantContent.thinking?.text).toBe("Thinking in stream...");
    expect(assistantContent.thinking?.signature).toBe("sig-stream");
    expect(assistantContent.thinking?.tokens).toBe(20);
  });
});
