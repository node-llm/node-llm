import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { BadRequestError, RateLimitError, ServerError } from "../../../src/errors/index.js";
import { FallbackEvent } from "../../../src/executor/Fallback.js";

const rateLimited = () => new RateLimitError("slow down", {});
const serverDown = () => new ServerError("down", 503, {});

function backup(replies: (string | Error)[]) {
  const provider = new FakeProvider(replies);
  provider.id = "backup";
  return provider;
}

describe("Chat fallbacks", () => {
  it("answers from a fallback model on the same provider", async () => {
    const provider = new FakeProvider([rateLimited(), "from fallback"]);
    const chat = new Chat(provider, "main-model").withFallbacks("small-model");

    const reply = await chat.ask("hi");

    expect(reply.content).toBe("from fallback");
    expect(reply.model).toBe("small-model");
    expect(provider.lastRequest?.model).toBe("small-model");
  });

  it("switches provider and reports it", async () => {
    const other = backup(["from backup"]);
    const events: FallbackEvent[] = [];
    const chat = new Chat(new FakeProvider([serverDown()]), "main-model", {
      resolveProvider: (name) => {
        expect(name).toBe("backup");
        return other;
      }
    })
      .withFallbacks({ model: "backup-model", provider: "backup" })
      .onFallback((event) => {
        events.push(event);
      });

    const reply = await chat.ask("hi");

    expect(reply.content).toBe("from backup");
    expect(reply.provider).toBe("backup");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      from: { model: "main-model", provider: "fake" },
      to: { model: "backup-model", provider: "backup" },
      attempt: 1
    });
    expect(events[0]!.error).toBeInstanceOf(ServerError);
  });

  it("tries fallbacks in order and throws the last error when all fail", async () => {
    const provider = new FakeProvider([rateLimited(), serverDown(), rateLimited()]);
    const chat = new Chat(provider, "a").withFallbacks("b", "c");

    await expect(chat.ask("hi")).rejects.toBeInstanceOf(RateLimitError);
  });

  it("does not fall back on a bad request", async () => {
    const provider = new FakeProvider([new BadRequestError("bad", {}), "unused"]);
    const chat = new Chat(provider, "a").withFallbacks("b");

    await expect(chat.ask("hi")).rejects.toBeInstanceOf(BadRequestError);
  });

  it("starts the next request on the chat's own model", async () => {
    const provider = new FakeProvider([rateLimited(), "fallback", "main again"]);
    const chat = new Chat(provider, "a").withFallbacks("b");

    await chat.ask("one");
    const second = await chat.ask("two");

    expect(second.content).toBe("main again");
    expect(provider.lastRequest?.model).toBe("a");
  });

  it("falls back when a stream fails before its first chunk", async () => {
    const provider = new FakeProvider([rateLimited(), "streamed fallback"]);
    const chat = new Chat(provider, "a").withFallbacks("b");

    let text = "";
    for await (const chunk of chat.stream("hi")) text += chunk.content;

    expect(text).toBe("streamed fallback");
    expect(provider.lastRequest?.model).toBe("b");
  });
});
