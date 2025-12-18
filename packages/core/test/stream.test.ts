import { Chat } from "../src/chat/Chat.js";
import { FakeStreamingProvider } from "./fake-streaming-provider.js";
import { expect, it } from "vitest";

it("streams tokens and stores final assistant message", async () => {
  const chat = new Chat(new FakeStreamingProvider(), "test");

  let result = "";

  for await (const token of chat.stream("Hi")) {
    result += token;
  }

  expect(result).toBe("Hello world");
  expect(chat.history.at(-1)?.content).toBe("Hello world");
});
