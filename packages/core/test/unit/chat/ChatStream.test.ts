import { ChatStream } from "../../../src/chat/ChatStream.js";
import { FakeStreamingProvider } from "../../fake-streaming-provider.js";
import { expect, it } from "vitest";

it("streams tokens and stores final assistant message", async () => {
  const handler = new ChatStream(new FakeStreamingProvider(), "test");
  const stream = handler.create("Hi");

  let result = "";
 
  for await (const chunk of stream) {
    result += chunk.content;
  }
 
  expect(result).toBe("Hello world");
  expect(handler.history.at(-1)?.content).toBe("Hello world");
});
