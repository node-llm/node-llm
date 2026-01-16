import { config } from "../config.js";

class Logger {
  private isDebugEnabled(): boolean {
    return config.debug === true;
  }

  debug(message: string, data?: unknown): void {
    if (this.isDebugEnabled()) {
      const formattedData = data ? `\n${JSON.stringify(data, null, 2)}` : "";
      console.log(`[NodeLLM Debug] ${message}${formattedData}`);
    }
  }

  /**
   * Log HTTP request details for debugging
   */
  logRequest(provider: string, method: string, url: string, body?: unknown): void {
    if (this.isDebugEnabled()) {
      console.log(`[NodeLLM] [${provider}] Request: ${method} ${url}`);
      if (body) {
        console.log(JSON.stringify(body, null, 2));
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
        console.log(JSON.stringify(body, null, 2));
      }
    }
  }

  warn(message: string): void {
    console.warn(`[NodeLLM] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[NodeLLM Error] ${message}`, error || "");
  }

  info(message: string): void {
    console.log(`[NodeLLM] ${message}`);
  }
}

export const logger = new Logger();
