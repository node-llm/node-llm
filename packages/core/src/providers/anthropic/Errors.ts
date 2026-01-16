import {
  BadRequestError,
  AuthenticationError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError,
  APIError
} from "../../errors/index.js";

export async function handleAnthropicError(response: Response, modelId: string): Promise<never> {
  const status = response.status;
  let body: unknown;
  let message = `Anthropic error (${status})`;

  try {
    body = await response.json();
    if (body && typeof body === "object" && "error" in body) {
       const err = (body as { error: { message: string } }).error;
       if (err && err.message) {
         message = err.message;
       }
    }
  } catch {
    body = await response.text().catch(() => "Unknown error");
    message = `Anthropic error (${status}): ${body}`;
  }

  const provider = "anthropic";

  if (status === 400) {
    throw new BadRequestError(message, body, provider, modelId);
  }

  if (status === 401 || status === 403) {
    throw new AuthenticationError(message, status, body, provider);
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
