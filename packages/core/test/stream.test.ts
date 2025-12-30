import { Stream } from "../src/chat/Stream.js";
import { FakeStreamingProvider } from "./fake-streaming-provider.js";
import { expect, it } from "vitest";

it("streams tokens and stores final assistant message", async () => {
  const stream = new Stream(new FakeStreamingProvider(), "test");

  let result = "";

  for await (const token of stream.stream("Hi")) {
    result += token;
  }

  expect(result).toBe("Hello world");
  expect(stream.history.at(-1)?.content).toBe("Hello world");
});
