export const DEFAULT_SECRET_PATTERNS = [
  // API Keys & Auth Tokens
  /(?<![A-Za-z0-9])sk-[a-zA-Z0-9_-]{20,256}/g, // OpenAI, Anthropic (sk-ant-...), OpenRouter (sk-or-v1-...) keys
  /\bxai-[a-zA-Z0-9]{20,}/g, // xAI keys
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key IDs
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, // GitHub tokens
  /(?<=\bBearer\s+)[A-Za-z0-9._~+/=-]{16,}/g, // Bearer tokens in any header or body
  /x-[a-zA-Z0-9]{20,}/g, // Generic key patterns
  /ey[a-zA-Z0-9-_=]+\.ey[a-zA-Z0-9-_=]+\.?[a-zA-Z0-9-_.+/=]*/g, // JWT tokens
  /\b(AIza[0-9A-Za-z-_]{35})\b/g, // Google API keys
  /\b[0-9a-f]{32,}\b/gi, // Long hex hashes/IDs (often keys)

  // PII (Personal Identifiable Information)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IPv4 Addresses
  /\b(access_key|secret_key|aws_access_key_id|aws_secret_access_key):\s*[^\s,{}"]+/gi // AWS-like pairs
];

export interface ScrubberOptions {
  customScrubber?: (data: unknown) => unknown;
  sensitivePatterns?: RegExp[];
  sensitiveKeys?: string[];
}

export class Scrubber {
  private customScrubber?: (data: unknown) => unknown;
  private sensitivePatterns: RegExp[];
  private sensitiveKeys: Set<string>;

  constructor(options: ScrubberOptions = {}) {
    this.customScrubber = options.customScrubber;
    this.sensitivePatterns = [...DEFAULT_SECRET_PATTERNS, ...(options.sensitivePatterns || [])];
    this.sensitiveKeys = new Set([
      "key",
      "api_key",
      "apikey",
      "token",
      "auth",
      "authorization",
      "password",
      "secret",
      "cookie",
      "set-cookie",
      "x-api-key",
      "x-goog-api-key",
      "api-key",
      "proxy-authorization",
      "x-auth-token",
      "access_key",
      "secret_key",
      "bearer",
      "credential",
      ...(options.sensitiveKeys || []).map((k) => k.toLowerCase())
    ]);
  }

  /**
   * Applies scrubbing to the data using default patterns and custom logic.
   */
  public scrub(data: unknown): unknown {
    // 1. Perform deep regex scrubbing and key-based scrubbing
    let result = this.deepScrub(data);

    // 2. Run custom hook on the scrubbed data if provided
    if (this.customScrubber) {
      result = this.customScrubber(result);
    }

    return result;
  }

  private deepScrub(val: unknown): unknown {
    if (typeof val === "string") {
      let scrubbed = val;
      for (const pattern of this.sensitivePatterns) {
        scrubbed = scrubbed.replace(pattern, "[REDACTED]");
      }
      return scrubbed;
    }

    if (Array.isArray(val)) {
      return val.map((v) => this.deepScrub(v));
    }

    if (val instanceof Map) {
      const newMap = new Map();
      for (const [k, v] of val.entries()) {
        const scrubbedKey = typeof k === "string" ? this.deepScrub(k) : k;
        const scrubbedValue = this.deepScrub(v);
        newMap.set(scrubbedKey, scrubbedValue);
      }
      return newMap;
    }

    if (val instanceof Set) {
      const newSet = new Set();
      for (const v of val.values()) {
        newSet.add(this.deepScrub(v));
      }
      return newSet;
    }

    if (val instanceof Date) {
      return new Date(val);
    }

    if (val instanceof RegExp) {
      return new RegExp(val);
    }

    if (typeof Buffer !== "undefined" && Buffer.isBuffer(val)) {
      return Buffer.from(val);
    }

    if (val !== null && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      const newObj: Record<string, unknown> = {};

      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        const lowerKey = key.toLowerCase();
        const value = obj[key];

        // SENSITIVE KEY LOGIC:
        // Only redact if the key looks like a credential AND the value is a string.
        // We don't want to redact 'total_tokens' or 'input_tokens' which are numbers.
        const isCredentialKey = this.sensitiveKeys.has(lowerKey);

        if (isCredentialKey && typeof value === "string") {
          newObj[key] = "[REDACTED]";
        } else {
          newObj[key] = this.deepScrub(value);
        }
      }
      return newObj;
    }

    return val;
  }
}
