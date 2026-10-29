import {
  BadRequestError,
  ContextWindowExceededError,
  InsufficientQuotaError,
  InvalidModelError,
  NotFoundError,
  AuthenticationError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError,
  APIError
} from "../../errors/index.js";
import { isBillingProblem } from "../../errors/billing.js";

export async function handleOpenAIError(response: Response, model?: string): Promise<never> {
  const status = response.status;
  let body: any;
  let message = `OpenAI error (${status})`;
  let code: string | undefined;

  try {
    body = await response.json();
    if (body && typeof body === "object") {
      if ("error" in body) {
        const err = body.error;
        if (typeof err === "string") {
          message = err;
        } else if (err && typeof err === "object") {
          if (err.message) message = err.message;
          if (err.code) code = err.code;
        }
      } else if ("message" in body) {
        message = (body as any).message;
      }
    }
  } catch {
    // If not JSON, use the status text
    body = await response.text().catch(() => "Unknown error");
    message = `OpenAI error (${status}): ${body}`;
  }

  const provider = "openai";

  if (isBillingProblem(status, message, code)) {
    throw new InsufficientQuotaError(message, body, provider, model);
  }

  if (status === 400) {
    if (
      code === "context_length_exceeded" ||
      message.includes("context length") ||
      message.includes("too many tokens")
    ) {
      throw new ContextWindowExceededError(message, body, provider, model);
    }
    throw new BadRequestError(message, body, provider, model);
  }

  if (status === 401 || status === 403) {
    throw new AuthenticationError(message, status, body, provider);
  }

  if (status === 404) {
    if (code === "model_not_found") {
      throw new InvalidModelError(message, body, provider, model);
    }
    throw new NotFoundError(message, status, body, provider, model);
  }

  if (status === 429) {
    throw new RateLimitError(message, body, provider, model);
  }

  if (status === 502 || status === 503) {
    throw new ServiceUnavailableError(message, status, body, provider, model);
  }

  if (status >= 500) {
    throw new ServerError(message, status, body, provider, model);
  }

  throw new APIError(message, status, body, provider, model);
}
