import { Middleware, MiddlewareContext } from "../types/Middleware.js";

export interface PIIMaskOptions {
  /**
   * Custom masking string. Defaults to "[REDACTED]".
   */
  mask?: string;
  /**
   * Whether to redact the assistant's output as well. Defaults to false.
   */
  redactOutput?: boolean;
}

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
};

/**
 * Middleware that automatically redacts Personal Identifiable Information (PII)
 * from user messages before they are sent to the LLM.
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

  private maskText(text: string, mask: string): string {
    let masked = text;
    for (const pattern of Object.values(PII_PATTERNS)) {
      masked = masked.replace(pattern, mask);
    }
    return masked;
  }
}
