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

export async function handleAnthropicError(response: Response, modelId: string): Promise<never> {
  const status = response.status;
  let body: any;
  let message = `Anthropic error (${status})`;
  let errorType: string | undefined;

  try {
    body = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const err = body.error;
      if (err && err.message) {
        message = err.message;
        errorType = err.type;
      }
    }
  } catch {
    body = await response.text().catch(() => "Unknown error");
    message = `Anthropic error (${status}): ${body}`;
  }

  const provider = "anthropic";

  if (isBillingProblem(status, message)) {
    throw new InsufficientQuotaError(message, body, provider, modelId);
  }

  if (status === 400) {
    if (message.includes("prompt is too long") || message.includes("context_length")) {
      throw new ContextWindowExceededError(message, body, provider, modelId);
    }
    throw new BadRequestError(message, body, provider, modelId);
  }

  if (status === 401 || status === 403) {
    throw new AuthenticationError(message, status, body, provider);
  }

  if (status === 404) {
    if (message.includes("model") || errorType === "not_found_error") {
      throw new InvalidModelError(message, body, provider, modelId);
    }
    throw new NotFoundError(message, status, body, provider, modelId);
  }

  if (status === 429) {
    throw new RateLimitError(message, body, provider, modelId);
  }

  if (status === 502 || status === 503 || status === 529) {
    throw new ServiceUnavailableError(message, status, body, provider, modelId);
  }

  if (status >= 500) {
    throw new ServerError(message, status, body, provider, modelId);
  }

  throw new APIError(message, status, body, provider, modelId);
}
