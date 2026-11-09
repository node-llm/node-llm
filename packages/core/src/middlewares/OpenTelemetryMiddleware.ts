import { Middleware, MiddlewareContext, NodeLLMResponse } from "../types/Middleware.js";
import { ToolCall } from "../chat/Tool.js";

/**
 * The parts of `@opentelemetry/api` this middleware uses. Typed structurally so
 * NodeLLM does not depend on the package: pass the module you already have.
 */
export interface OpenTelemetryApi {
  trace: {
    getTracer(name: string, version?: string): OTelTracer;
    setSpan(context: unknown, span: OTelSpan): unknown;
  };
  context: { active(): unknown };
}

interface OTelTracer {
  startSpan(
    name: string,
    options?: { kind?: number; attributes?: Record<string, AttributeValue> },
    context?: unknown
  ): OTelSpan;
}

interface OTelSpan {
  setAttribute(key: string, value: AttributeValue): unknown;
  setStatus(status: { code: number; message?: string }): unknown;
  recordException(exception: Error): unknown;
  end(): void;
}

type AttributeValue = string | number | boolean | string[];

const SPAN_KIND_INTERNAL = 0;
const SPAN_KIND_CLIENT = 2;
const STATUS_ERROR = 2;

const SPAN = "otel.span";
const TOOL_SPANS = "otel.toolSpans";

export interface OpenTelemetryOptions {
  /** Tracer name. Defaults to "node-llm". */
  tracerName?: string;
}

/**
 * Emits an OpenTelemetry span for each chat, embedding, image, transcription,
 * moderation and judgment call, and a child span for each tool call. Spans
 * follow the GenAI semantic conventions (`gen_ai.*`) and never include
 * prompts, responses or tool arguments.
 *
 * @example
 * ```typescript
 * import * as otel from "@opentelemetry/api";
 * const llm = createLLM({ provider: "openai", middlewares: [OpenTelemetry(otel)] });
 * ```
 */
export class OpenTelemetryMiddleware implements Middleware {
  public readonly name = "OpenTelemetry";
  private readonly tracer: OTelTracer;

  constructor(
    private readonly api: OpenTelemetryApi,
    options: OpenTelemetryOptions = {}
  ) {
    this.tracer = api.trace.getTracer(options.tracerName ?? "node-llm");
  }

  async onRequest(ctx: MiddlewareContext): Promise<void> {
    const operation = operationName(ctx);
    const attributes: Record<string, AttributeValue> = {
      "gen_ai.operation.name": operation,
      "gen_ai.provider.name": ctx.provider.toLowerCase(),
      "gen_ai.system": ctx.provider.toLowerCase(),
      "gen_ai.request.model": ctx.model,
      "node_llm.request_id": ctx.requestId
    };
    if (ctx.options?.temperature !== undefined) {
      attributes["gen_ai.request.temperature"] = ctx.options.temperature;
    }
    if (ctx.options?.maxTokens !== undefined) {
      attributes["gen_ai.request.max_tokens"] = ctx.options.maxTokens;
    }

    ctx.state[SPAN] = this.tracer.startSpan(`${operation} ${ctx.model}`, {
      kind: SPAN_KIND_CLIENT,
      attributes
    });
  }

  async onResponse(ctx: MiddlewareContext, result: NodeLLMResponse): Promise<void> {
    const span = ctx.state[SPAN] as OTelSpan | undefined;
    if (!span) return;

    const response = result as {
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number; cached_tokens?: number };
      finish_reason?: string | null;
    };
    if (response.model) span.setAttribute("gen_ai.response.model", response.model);
    if (response.usage?.input_tokens !== undefined) {
      span.setAttribute("gen_ai.usage.input_tokens", response.usage.input_tokens);
    }
    if (response.usage?.output_tokens !== undefined) {
      span.setAttribute("gen_ai.usage.output_tokens", response.usage.output_tokens);
    }
    if (response.usage?.cached_tokens) {
      span.setAttribute("gen_ai.usage.cache_read.input_tokens", response.usage.cached_tokens);
    }
    if (response.finish_reason) {
      span.setAttribute("gen_ai.response.finish_reasons", [response.finish_reason]);
    }
    this.end(ctx);
  }

  async onError(ctx: MiddlewareContext, error: Error): Promise<void> {
    const span = ctx.state[SPAN] as OTelSpan | undefined;
    if (!span) return;
    fail(span, error);
    this.end(ctx);
  }

  async onToolCallStart(ctx: MiddlewareContext, tool: ToolCall): Promise<void> {
    const parent = ctx.state[SPAN] as OTelSpan | undefined;
    const parentContext = parent
      ? this.api.trace.setSpan(this.api.context.active(), parent)
      : undefined;
    const span = this.tracer.startSpan(
      `execute_tool ${tool.function.name}`,
      {
        kind: SPAN_KIND_INTERNAL,
        attributes: {
          "gen_ai.operation.name": "execute_tool",
          "gen_ai.tool.name": tool.function.name,
          "gen_ai.tool.call.id": tool.id
        }
      },
      parentContext
    );
    toolSpans(ctx).set(tool.id, span);
  }

  async onToolCallEnd(ctx: MiddlewareContext, tool: ToolCall): Promise<void> {
    const spans = toolSpans(ctx);
    spans.get(tool.id)?.end();
    spans.delete(tool.id);
  }

  async onToolCallError(ctx: MiddlewareContext, tool: ToolCall, error: Error): Promise<void> {
    const spans = toolSpans(ctx);
    const span = spans.get(tool.id);
    if (!span) return;
    fail(span, error);
    span.end();
    spans.delete(tool.id);
  }

  private end(ctx: MiddlewareContext): void {
    for (const span of toolSpans(ctx).values()) span.end();
    toolSpans(ctx).clear();
    (ctx.state[SPAN] as OTelSpan).end();
    delete ctx.state[SPAN];
  }
}

function operationName(ctx: MiddlewareContext): string {
  if (ctx.input !== undefined) return "embeddings";
  if (ctx.imageOptions) return "generate_image";
  if (ctx.transcriptionOptions) return "transcribe";
  if (ctx.moderationOptions) return "moderate";
  if (ctx.judgmentOptions) return "judge";
  return "chat";
}

function toolSpans(ctx: MiddlewareContext): Map<string, OTelSpan> {
  let spans = ctx.state[TOOL_SPANS] as Map<string, OTelSpan> | undefined;
  if (!spans) {
    spans = new Map();
    ctx.state[TOOL_SPANS] = spans;
  }
  return spans;
}

function fail(span: OTelSpan, error: Error): void {
  span.recordException(error);
  span.setStatus({ code: STATUS_ERROR, message: error.message });
  span.setAttribute("error.type", error.name || "Error");
}

/** Factory for {@link OpenTelemetryMiddleware}. */
export function OpenTelemetry(
  api: OpenTelemetryApi,
  options: OpenTelemetryOptions = {}
): OpenTelemetryMiddleware {
  return new OpenTelemetryMiddleware(api, options);
}
