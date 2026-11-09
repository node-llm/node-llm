import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Chat } from "../../../src/chat/Chat.js";
import { defineTool } from "../../../src/chat/Tool.js";
import { OpenTelemetry, OpenTelemetryApi } from "../../../src/middlewares/index.js";
import { RateLimitError } from "../../../src/errors/index.js";
import { FakeProvider } from "../../fake-provider.js";

interface RecordedSpan {
  name: string;
  kind?: number;
  attributes: Record<string, unknown>;
  parent?: RecordedSpan;
  status?: { code: number; message?: string };
  exceptions: Error[];
  ended: boolean;
}

function fakeOtel() {
  const spans: RecordedSpan[] = [];
  const api: OpenTelemetryApi = {
    context: { active: () => ({}) },
    trace: {
      setSpan: (_ctx, span) => ({ span }),
      getTracer: () => ({
        startSpan(name, options, context) {
          const span: RecordedSpan = {
            name,
            kind: options?.kind,
            attributes: { ...options?.attributes },
            parent: (context as { span?: { record: RecordedSpan } } | undefined)?.span?.record,
            exceptions: [],
            ended: false
          };
          spans.push(span);
          return {
            record: span,
            setAttribute: (k: string, v: unknown) => (span.attributes[k] = v),
            setStatus: (s: { code: number; message?: string }) => (span.status = s),
            recordException: (e: Error) => span.exceptions.push(e),
            end: () => (span.ended = true)
          };
        }
      })
    }
  };
  return { api, spans };
}

const Weather = defineTool({
  name: "get_weather",
  description: "Weather for a city",
  schema: z.object({ city: z.string() }),
  execute: async ({ city }) => `Sunny in ${city}`
});

describe("OpenTelemetry middleware", () => {
  it("records a chat span with GenAI attributes and no content", async () => {
    const { api, spans } = fakeOtel();
    const provider = new FakeProvider([
      {
        content: "secret answer",
        usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 },
        finish_reason: "stop"
      }
    ]);
    const chat = new Chat(provider, "gpt-test", { middlewares: [OpenTelemetry(api)] });

    await chat.ask("secret question");

    expect(spans).toHaveLength(1);
    const [span] = spans;
    expect(span!.name).toBe("chat gpt-test");
    expect(span!.kind).toBe(2);
    expect(span!.ended).toBe(true);
    expect(span!.attributes).toMatchObject({
      "gen_ai.operation.name": "chat",
      "gen_ai.provider.name": "fake",
      "gen_ai.request.model": "gpt-test",
      "gen_ai.response.model": "gpt-test",
      "gen_ai.usage.input_tokens": 10,
      "gen_ai.usage.output_tokens": 4,
      "gen_ai.response.finish_reasons": ["stop"]
    });
    expect(JSON.stringify(span!.attributes)).not.toContain("secret");
  });

  it("records tool calls as child spans", async () => {
    const { api, spans } = fakeOtel();
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [
          {
            id: "c1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"Oslo"}' }
          }
        ]
      },
      "Sunny"
    ]);
    const chat = new Chat(provider, "m", { middlewares: [OpenTelemetry(api)] }).withTool(Weather);

    await chat.ask("Weather?");

    const tool = spans.find((s) => s.name === "execute_tool get_weather");
    expect(tool).toBeDefined();
    expect(tool!.attributes).toMatchObject({
      "gen_ai.tool.name": "get_weather",
      "gen_ai.tool.call.id": "c1"
    });
    expect(tool!.parent).toBe(spans.find((s) => s.name === "chat m"));
    expect(tool!.ended).toBe(true);
  });

  it("marks the span as failed on error", async () => {
    const { api, spans } = fakeOtel();
    const chat = new Chat(new FakeProvider([new RateLimitError("slow", {})]), "m", {
      middlewares: [OpenTelemetry(api)]
    });

    await expect(chat.ask("hi")).rejects.toThrow("slow");

    expect(spans[0]!.status).toEqual({ code: 2, message: "slow" });
    expect(spans[0]!.attributes["error.type"]).toBe("RateLimitError");
    expect(spans[0]!.ended).toBe(true);
  });
});
