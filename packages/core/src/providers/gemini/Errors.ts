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

export async function handleGeminiError(response: Response, model?: string): Promise<never> {
  const status = response.status;
  let body: any;
  let message = `Gemini error (${status})`;

  try {
    body = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const err = body.error;
      if (err && err.message) {
        message = err.message;
      }
    }
  } catch {
    // If not JSON, use the status text
    body = await response.text().catch(() => "Unknown error");
    message = `Gemini error (${status}): ${body}`;
  }

  const provider = "gemini";

  if (isBillingProblem(status, message)) {
    throw new InsufficientQuotaError(message, body, provider, model);
  }

  if (status === 400) {
    if (message.includes("limit") || message.includes("context") || message.includes("token")) {
      throw new ContextWindowExceededError(message, body, provider, model);
    }
    throw new BadRequestError(message, body, provider, model);
  }

  if (status === 401 || status === 403) {
    throw new AuthenticationError(message, status, body, provider);
  }

  if (status === 404) {
    if (message.includes("model")) {
      throw new InvalidModelError(message, body, provider, model);
    }
    throw new NotFoundError(message, status, body, provider, model);
  }

  if (status === 429) {
    throw new RateLimitError(message, body, provider, model);
  }

  if (status === 502 || status === 503 || status === 504) {
    throw new ServiceUnavailableError(message, status, body, provider, model);
  }

  if (status >= 500) {
    throw new ServerError(message, status, body, provider, model);
  }

  throw new APIError(message, status, body, provider, model);
}
