import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { RateLimitError } from "../../../src/errors/index.js";
import { FallbackEvent } from "../../../src/executor/Fallback.js";
import { Middleware, MiddlewareContext } from "../../../src/types/Middleware.js";
import { OpenTelemetry } from "../../../src/middlewares/OpenTelemetryMiddleware.js";

const rateLimited = () => new RateLimitError("slow down", {});

function recorder() {
  const seen: { requestId: string; event: FallbackEvent }[] = [];
  const middleware: Middleware = {
    name: "Recorder",
    async onFallback(ctx: MiddlewareContext, event: FallbackEvent) {
      seen.push({ requestId: ctx.requestId, event });
    }
  };
  return { seen, middleware };
}

describe("onFallback middleware hook", () => {
  it("runs with the request's context when ask() falls back", async () => {
    const { seen, middleware } = recorder();
    const chat = new Chat(new FakeProvider([rateLimited(), "ok"]), "main", {
      middlewares: [middleware]
    }).withFallbacks("small");

    await chat.ask("hi");

    expect(seen).toHaveLength(1);
    expect(seen[0]!.requestId).toBeTruthy();
    expect(seen[0]!.event).toMatchObject({ from: { model: "main" }, to: { model: "small" } });
  });

  it("runs when stream() falls back", async () => {
    const { seen, middleware } = recorder();
    const chat = new Chat(new FakeProvider([rateLimited(), "ok"]), "main", {
      middlewares: [middleware]
    }).withFallbacks("small");

    for await (const _chunk of chat.stream("hi")) {
      // drain
    }

    expect(seen).toHaveLength(1);
    expect(seen[0]!.event.to.model).toBe("small");
  });

  it("does not run without a fallback", async () => {
    const { seen, middleware } = recorder();
    await new Chat(new FakeProvider(["ok"]), "main", { middlewares: [middleware] }).ask("hi");
    expect(seen).toHaveLength(0);
  });

  it("adds a fallback event to the OpenTelemetry span", async () => {
    const events: { name: string; attributes?: Record<string, unknown> }[] = [];
    const attributes: Record<string, unknown> = {};
    const otel = {
      context: { active: () => ({}) },
      trace: {
        setSpan: () => ({}),
        getTracer: () => ({
          startSpan: (_name: string, options?: { attributes?: Record<string, unknown> }) => {
            Object.assign(attributes, options?.attributes);
            return {
              setAttribute: (key: string, value: unknown) => (attributes[key] = value),
              setStatus: () => {},
              recordException: () => {},
              addEvent: (name: string, attrs?: Record<string, unknown>) =>
                events.push({ name, attributes: attrs }),
              end: () => {}
            };
          }
        })
      }
    };
    const chat = new Chat(new FakeProvider([rateLimited(), "ok"]), "main", {
      middlewares: [OpenTelemetry(otel)]
    }).withFallbacks("small");

    await chat.ask("hi");

    expect(events).toHaveLength(1);
    expect(events[0]!.name).toBe("node_llm.fallback");
    expect(events[0]!.attributes).toMatchObject({
      "node_llm.fallback.from.model": "main",
      "node_llm.fallback.to.model": "small",
      "error.type": "RateLimitError"
    });
    expect(attributes["gen_ai.response.model"]).toBe("small");
  });
});
