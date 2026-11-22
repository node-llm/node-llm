import { config } from "../config.js";
import { redactForLog, redactSecrets } from "./redact.js";

export { redactForLog };

/**
 * Masks credentials passed as URL query parameters (e.g. Gemini's `?key=...`)
 * so they never reach stdout or a log aggregator when debug logging is on.
 */
function redactUrl(url: string): string {
  return url.replace(/([?&](?:key|api_key|apikey|access_token|token)=)[^&#]+/gi, "$1[REDACTED]");
}

class Logger {
  private isDebugEnabled(): boolean {
    return config.debug === true;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDebugEnabled()) {
      const formattedData = data ? `\n${JSON.stringify(redactForLog(data), null, 2)}` : "";
      console.log(`[NodeLLM Debug] ${message}${formattedData}`);
    }
  }

  /**
   * Log HTTP request details for debugging
   */
  logRequest(provider: string, method: string, url: string, body?: unknown): void {
    if (this.isDebugEnabled()) {
      console.log(`[NodeLLM] [${provider}] Request: ${method} ${redactUrl(url)}`);
      if (body) {
        console.log(JSON.stringify(redactForLog(body), null, 2));
      }
    }
  }

  /**
   * Log HTTP response details for debugging
   */
  logResponse(provider: string, status: number, statusText: string, body?: unknown): void {
    if (this.isDebugEnabled()) {
      console.log(`[NodeLLM] [${provider}] Response: ${status} ${statusText}`);
      if (body) {
        console.log(JSON.stringify(redactForLog(body), null, 2));
      }
    }
  }

  warn(message: string): void {
    console.warn(`[NodeLLM] ${message}`);
  }

  error(message: string, error?: Error): void {
    // Tool and provider errors can carry keys or connection strings: masked, always printed.
    console.error(`[NodeLLM Error] ${redactSecrets(message)}`, error ? maskedError(error) : "");
  }

  info(message: string): void {
    console.log(`[NodeLLM] ${message}`);
  }
}

export const logger = new Logger();

/** An error's name, message and stack with keys and passwords masked, for printing. */
function maskedError(error: unknown): string {
  if (!(error instanceof Error)) return redactSecrets(String(error));
  const text = error.stack ?? `${error.name}: ${error.message}`;
  return redactSecrets(text);
}
