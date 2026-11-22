import {
  Middleware,
  MiddlewareContext,
  NodeLLMResponse,
  RequestDirective,
  ToolResultChange
} from "../types/Middleware.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolCall } from "../chat/Tool.js";

export interface PIIMaskOptions {
  /**
   * Custom masking string. Defaults to "[REDACTED]".
   */
  mask?: string;
  /**
   * Whether to redact the assistant's output as well. Defaults to false. Applies to what `ask()`
   * returns; streamed text has already been sent by the time it could be masked.
   */
  redactOutput?: boolean;
}

const PII_PATTERNS = {
  // Bounded, and must start a word, so a long run of letters can't make it slow.
  email:
    /(?<![a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){0,8}\.[a-zA-Z]{2,24}(?![a-zA-Z])/g,
  // Before the number patterns, which would otherwise take an IBAN's digits.
  iban: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g,
  // International numbers, written with a leading + and country code.
  internationalPhone: /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}\b/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
};

/**
 * Middleware that automatically redacts Personal Identifiable Information (PII)
 * from messages before they are sent to the LLM: the conversation when an ask starts, and each
 * tool result before the model sees it.
 */
export class PIIMaskMiddleware implements Middleware {
  public readonly name = "PIIMask";

  constructor(private options: PIIMaskOptions = {}) {}

  async onRequest(ctx: MiddlewareContext): Promise<void> {
    if (!ctx.messages) return;

    const mask = this.options.mask || "[REDACTED]";

    for (const message of ctx.messages) {
      if (typeof message.content === "string") {
        message.content = this.maskText(message.content, mask);
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "text") {
            part.text = this.maskText(part.text, mask);
          }
        }
      }
    }
  }

  /** Masks every tool result, errors included, before the model sees it. */
  async onToolResult(
    _ctx: MiddlewareContext,
    _tool: ToolCall,
    content: string,
    _info: { isError: boolean }
  ): Promise<ToolResultChange | void> {
    const masked = this.mask(content);
    return masked === content ? undefined : { content: masked };
  }

  /**
   * Masks personal data in text. JSON is masked in its string values only, so numbers such as
   * timestamps and ids are left alone and the JSON stays valid.
   */
  mask(text: string): string {
    const mask = this.options.mask || "[REDACTED]";
    const trimmed = text.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(text) as unknown;
        return JSON.stringify(this.maskValue(parsed, mask, 0));
      } catch {
        // Not JSON: masked as text.
      }
    }
    return this.maskText(text, mask);
  }

  private maskValue(value: unknown, mask: string, depth: number): unknown {
    if (typeof value === "string") return this.maskText(value, mask);
    if (depth > 30 || value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((item) => this.maskValue(item, mask, depth + 1));
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        this.maskValue(item, mask, depth + 1)
      ])
    );
  }

  /** With `redactOutput`, masks the answer `ask()` returns. */
  async onResponse(_ctx: MiddlewareContext, result: NodeLLMResponse): Promise<RequestDirective> {
    if (!this.options.redactOutput || !(result instanceof ChatResponseString)) return;
    const text = result.toString();
    const masked = this.mask(text);
    if (masked === text) return;
    return { action: "REPLACE", response: result.withContent(masked) };
  }

  private maskText(text: string, mask: string): string {
    let masked = text;
    for (const pattern of Object.values(PII_PATTERNS)) {
      masked = masked.replace(pattern, mask);
    }
    return masked;
  }
}
