import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ToolExecutionMode } from "../../../src/constants.js";

describe("Additive callback stacking", () => {
  it("runs multiple onNewMessage/onEndMessage handlers instead of the last one winning", async () => {
    const provider = new FakeProvider(["Hello world"]);
    const chat = new Chat(provider, "fake-model");

    const firstNew = vi.fn();
    const secondNew = vi.fn();
    const firstEnd = vi.fn();
    const secondEnd = vi.fn();

    chat
      .onNewMessage(firstNew)
      .onNewMessage(secondNew)
      .onEndMessage(firstEnd)
      .onEndMessage(secondEnd);

    await chat.ask("Hi");

    expect(firstNew).toHaveBeenCalledTimes(1);
    expect(secondNew).toHaveBeenCalledTimes(1);
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(secondEnd).toHaveBeenCalledTimes(1);
  });

  it("runs multiple onToolCallStart/onToolCallEnd handlers for the same call", async () => {
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [{ id: "c1", type: "function", function: { name: "t", arguments: "{}" } }]
      },
      "done"
    ]);
    const chat = new Chat(provider, "fake-model", {
      tools: [
        {
          type: "function",
          function: { name: "t", parameters: {} },
          handler: async () => "ok"
        }
      ]
    });

    const firstStart = vi.fn();
    const secondStart = vi.fn();
    const firstEnd = vi.fn();
    const secondEnd = vi.fn();

    chat
      .onToolCallStart(firstStart)
      .onToolCallStart(secondStart)
      .onToolCallEnd(firstEnd)
      .onToolCallEnd(secondEnd);

    await chat.ask("Go");

    expect(firstStart).toHaveBeenCalledTimes(1);
    expect(secondStart).toHaveBeenCalledTimes(1);
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(secondEnd).toHaveBeenCalledTimes(1);
  });

  it("requires every onConfirmToolCall handler to approve", async () => {
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [{ id: "c1", type: "function", function: { name: "t", arguments: "{}" } }]
      },
      "done"
    ]);
    const toolHandler = vi.fn(async () => "ok");
    const chat = new Chat(provider, "fake-model", {
      toolExecution: ToolExecutionMode.CONFIRM,
      tools: [{ type: "function", function: { name: "t", parameters: {} }, handler: toolHandler }]
    });

    chat.onConfirmToolCall(() => true).onConfirmToolCall(() => false);

    await chat.ask("Go");

    // Second handler declines, so the tool must not run.
    expect(toolHandler).not.toHaveBeenCalled();
    const toolMessage = chat.history.find((m) => m.role === "tool");
    expect(toolMessage?.content).toBe("Action cancelled by user.");
  });

  it("chains multiple beforeRequest/afterResponse handlers in registration order", async () => {
    const provider = new FakeProvider(["reply"]);
    const chat = new Chat(provider, "fake-model");

    chat
      .beforeRequest(async (messages) => messages.map((m) => ({ ...m, content: `${m.content}-A` })))
      .beforeRequest(async (messages) => messages.map((m) => ({ ...m, content: `${m.content}-B` })))
      .afterResponse(async (response) => response.withContent(`${response.content}-X`))
      .afterResponse(async (response) => response.withContent(`${response.content}-Y`));

    const res = await chat.ask("start");

    expect(provider.lastRequest?.messages?.[0]?.content).toBe("start-A-B");
    expect(res.content).toBe("reply-X-Y");
  });

  it("still stacks handlers for streaming requests", async () => {
    const provider = new FakeProvider(["Hello world"]);
    const chat = new Chat(provider, "fake-model");

    const firstNew = vi.fn();
    const secondNew = vi.fn();
    const firstEnd = vi.fn();
    const secondEnd = vi.fn();

    chat
      .onNewMessage(firstNew)
      .onNewMessage(secondNew)
      .onEndMessage(firstEnd)
      .onEndMessage(secondEnd);

    for await (const _chunk of chat.stream("Hi")) {
      /* consume */
    }

    expect(firstNew).toHaveBeenCalledTimes(1);
    expect(secondNew).toHaveBeenCalledTimes(1);
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(secondEnd).toHaveBeenCalledTimes(1);
  });
});
