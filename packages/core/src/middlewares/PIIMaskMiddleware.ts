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
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
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

  /** Masks a tool's result before the model sees it. */
  async onToolCallEnd(
    _ctx: MiddlewareContext,
    _tool: ToolCall,
    result: unknown
  ): Promise<ToolResultChange | void> {
    if (typeof result !== "string") return;
    const masked = this.maskText(result, this.options.mask || "[REDACTED]");
    return masked === result ? undefined : { content: masked };
  }

  /** With `redactOutput`, masks the answer `ask()` returns. */
  async onResponse(_ctx: MiddlewareContext, result: NodeLLMResponse): Promise<RequestDirective> {
    if (!this.options.redactOutput || !(result instanceof ChatResponseString)) return;
    const text = result.toString();
    const masked = this.maskText(text, this.options.mask || "[REDACTED]");
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
