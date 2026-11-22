import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { PIIMaskMiddleware } from "../../../src/middlewares/PIIMaskMiddleware.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { Middleware } from "../../../src/types/Middleware.js";

const usage = { input_tokens: 1, output_tokens: 1, total_tokens: 2 };

class Scripted implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  constructor(private replies: ChatResponse[]) {}
  defaultModel() {
    return "test-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({ ...request, messages: request.messages.map((m) => ({ ...m })) });
    return this.replies.shift()!;
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

const lookup = {
  type: "function" as const,
  function: {
    name: "lookup",
    description: "Look up",
    parameters: { type: "object", properties: {} }
  },
  handler: async () =>
    "Customer: jane@example.com, +44 20 7946 0958, IBAN GB82 WEST 1234 5698 7654 32"
};

const toolCall: ChatResponse = {
  content: null,
  usage,
  tool_calls: [{ id: "c1", type: "function", function: { name: "lookup", arguments: "{}" } }]
};

describe("PIIMaskMiddleware", () => {
  it("masks tool results before the model sees them", async () => {
    const provider = new Scripted([toolCall, { content: "Done.", usage }]);
    const chat = new Chat(provider, "test-model", {
      tools: [lookup],
      middlewares: [new PIIMaskMiddleware()]
    });

    await chat.ask("Find the customer");

    const sent = provider.requests[1]!.messages.find((m) => m.role === "tool");
    expect(sent?.content).toBe("Customer: [REDACTED], [REDACTED], IBAN [REDACTED]");
  });

  it("masks the answer with redactOutput, and leaves it without", async () => {
    const answer = "Write to jane@example.com.";
    const masked = new Chat(new Scripted([{ content: answer, usage }]), "test-model", {
      middlewares: [new PIIMaskMiddleware({ redactOutput: true })]
    });
    expect(String(await masked.ask("Who?"))).toBe("Write to [REDACTED].");

    const plain = new Chat(new Scripted([{ content: answer, usage }]), "test-model", {
      middlewares: [new PIIMaskMiddleware()]
    });
    expect(String(await plain.ask("Who?"))).toBe(answer);
  });

  it("leaves text without personal data alone", async () => {
    const provider = new Scripted([{ content: "ok", usage }]);
    const chat = new Chat(provider, "test-model", { middlewares: [new PIIMaskMiddleware()] });
    await chat.ask("Version 1.2.3 shipped on 2026-11-22 with 42 fixes");
    expect(provider.requests[0]!.messages[0]!.content).toBe(
      "Version 1.2.3 shipped on 2026-11-22 with 42 fixes"
    );
  });
});

describe("onToolCallEnd changing a result", () => {
  it("is applied in order, and hooks that return nothing change nothing", async () => {
    const seen: unknown[] = [];
    const watcher: Middleware = {
      name: "watcher",
      async onToolCallEnd(_ctx, _tool, result) {
        seen.push(result);
      }
    };
    const shortener: Middleware = {
      name: "shortener",
      async onToolCallEnd(_ctx, _tool, result) {
        return { content: String(result).slice(0, 8) };
      }
    };
    const provider = new Scripted([toolCall, { content: "Done.", usage }]);
    const chat = new Chat(provider, "test-model", {
      tools: [lookup],
      // onToolCallEnd runs last-added first: the shortener, then the watcher.
      middlewares: [watcher, shortener]
    });

    await chat.ask("Find the customer");

    expect(provider.requests[1]!.messages.find((m) => m.role === "tool")?.content).toBe("Customer");
    expect(seen).toEqual(["Customer"]);
  });
});

describe("review follow-ups", () => {
  it("keeps JSON tool results valid, masking only their strings", async () => {
    const json = { created: 1732233600, id: 4155550100, email: "jane@example.com" };
    const provider = new Scripted([toolCall, { content: "Done.", usage }]);
    const chat = new Chat(provider, "test-model", {
      tools: [{ ...lookup, handler: async () => JSON.stringify(json) }],
      middlewares: [new PIIMaskMiddleware()]
    });

    await chat.ask("Find the customer");

    const sent = provider.requests[1]!.messages.find((m) => m.role === "tool")!.content as string;
    expect(JSON.parse(sent)).toEqual({ created: 1732233600, id: 4155550100, email: "[REDACTED]" });
  });

  it("masks a tool's error before the model sees it", async () => {
    const provider = new Scripted([toolCall, { content: "Done.", usage }]);
    const failing = {
      ...lookup,
      handler: async () => {
        throw new Error("no account for jane@example.com");
      }
    };
    const chat = new Chat(provider, "test-model", {
      tools: [failing],
      middlewares: [new PIIMaskMiddleware()]
    });

    await chat.ask("Find the customer");

    const sent = provider.requests[1]!.messages.find((m) => m.role === "tool")!.content as string;
    expect(sent).toContain("no account for [REDACTED]");
  });

  it("stays fast on a long run of letters", () => {
    const middleware = new PIIMaskMiddleware();
    const start = performance.now();
    middleware.mask("a".repeat(80_000));
    middleware.mask("a.".repeat(40_000) + "@");
    expect(performance.now() - start).toBeLessThan(250);
  });

  it("keeps the masked answer in the history, and isn't overridden by another CONTINUE", async () => {
    const watcher: Middleware = { name: "watcher", onResponse: async () => "CONTINUE" };
    const provider = new Scripted([
      { content: "Write to jane@example.com.", usage },
      { content: "ok", usage }
    ]);
    const chat = new Chat(provider, "test-model", {
      middlewares: [new PIIMaskMiddleware({ redactOutput: true }), watcher]
    });

    expect(String(await chat.ask("Who?"))).toBe("Write to [REDACTED].");
    expect(chat.history.at(-1)?.content).toBe("Write to [REDACTED].");
    await chat.ask("Thanks");
    expect(JSON.stringify(provider.requests[1]!.messages)).not.toContain("jane@example.com");
  });
});
