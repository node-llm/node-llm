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

export async function handleMistralError(response: Response, model?: string): Promise<never> {
  const status = response.status;
  let body: any;
  let message = `Mistral error (${status})`;

  try {
    body = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const err = body.error;
      if (err && err.message) {
        message = typeof err.message === "string" ? err.message : JSON.stringify(err.message);
      }
    } else if (body && typeof body === "object" && "message" in body) {
      message = typeof body.message === "string" ? body.message : JSON.stringify(body.message);
    } else if (body && typeof body === "object" && "detail" in body) {
      message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    }
  } catch {
    body = await response.text().catch(() => "Unknown error");
    message = `Mistral error (${status}): ${body}`;
  }

  const provider = "mistral";

  if (status === 400) {
    if (message.includes("context") || message.includes("length") || message.includes("tokens")) {
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

  if (status === 422) {
    throw new BadRequestError(message, body, provider, model);
  }

  if (status === 429) {
    if (message.includes("quota") || message.includes("billing")) {
      throw new InsufficientQuotaError(message, body, provider);
    }
    throw new RateLimitError(message, status, body, provider);
  }

  if (status >= 500 && status < 600) {
    if (status === 503) {
      throw new ServiceUnavailableError(message, status, body, provider);
    }
    throw new ServerError(message, status, body, provider);
  }

  throw new APIError(message, status, body, provider, model);
}
