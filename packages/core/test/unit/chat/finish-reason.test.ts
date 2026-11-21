import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";

describe("finish reason", () => {
  it("is on the response of ask()", async () => {
    const provider = new FakeProvider([{ content: "cut", finish_reason: "length" }]);
    const response = await new Chat(provider, "fake-model").ask("hi");
    expect(response.finishReason).toBe("length");
  });

  it("is on the response of stream()", async () => {
    const provider = new FakeProvider([{ content: "cut", finish_reason: "length" }]);
    const chat = new Chat(provider, "fake-model");
    let finishReason: string | null | undefined;
    chat.onEndMessage((response) => {
      finishReason = response.finishReason;
    });
    for await (const _chunk of chat.stream("hi")) {
      // drain
    }
    expect(finishReason).toBe("length");
  });
});
