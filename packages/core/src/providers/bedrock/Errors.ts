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
  APIError,
  ForbiddenError
} from "../../errors/index.js";
import { isBillingProblem } from "../../errors/billing.js";

export async function handleBedrockError(response: Response, modelId: string): Promise<never> {
  const status = response.status;
  const errorText = await response.text();
  let message = errorText;
  let body: any;

  try {
    body = JSON.parse(errorText);
    message = body.message || errorText;
  } catch {
    body = errorText;
  }

  const provider = "bedrock";

  if (isBillingProblem(status, message)) {
    throw new InsufficientQuotaError(message, body, provider, modelId);
  }

  // Throttling
  if (status === 429 || message.includes("ThrottlingException")) {
    throw new RateLimitError(message, body, provider, modelId);
  }

  // Auth / Access
  if (status === 401) {
    throw new AuthenticationError(message, status, body, provider);
  }

  if (status === 403 || message.includes("AccessDeniedException")) {
    if (message.includes("model access")) {
      throw new ForbiddenError(
        `Access denied for model ${modelId}. Ensure you have requested access in the AWS Bedrock console.`,
        body,
        provider
      );
    }
    throw new ForbiddenError(message, body, provider);
  }

  // Not Found
  if (status === 404 || message.includes("ResourceNotFoundException")) {
    throw new InvalidModelError(message, body, provider, modelId);
  }

  // Bad Request
  if (status === 400 || message.includes("ValidationException")) {
    if (message.includes("context length") || message.includes("too many tokens")) {
      throw new ContextWindowExceededError(message, body, provider, modelId);
    }
    throw new BadRequestError(message, body, provider, modelId);
  }

  // Payment
  if (message.includes("INVALID_PAYMENT_INSTRUMENT")) {
    throw new InsufficientQuotaError(
      "Billing setup incomplete for AWS Marketplace models. Ensure a credit card is set as default payment method.",
      body,
      provider,
      modelId
    );
  }

  if (status >= 500) {
    if (status === 502 || status === 503) {
      throw new ServiceUnavailableError(message, status, body, provider, modelId);
    }
    throw new ServerError(message, status, body, provider, modelId);
  }

  throw new APIError(message, status, body, provider, modelId);
}
