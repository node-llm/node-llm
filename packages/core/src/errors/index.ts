/**
 * NodeLLM Error Hierarchy
 *
 * **Stability Contract**: These error types and their semantics are part of the
 * public API and will not change without a major version bump.
 *
 * - Error names are stable
 * - Error codes are stable
 * - Error semantics (when they're thrown) are stable
 * - New errors may be added (non-breaking)
 * - Existing error meanings will not change
 *
 * @see ARCHITECTURE.md for error contract details
 */

/**
 * Base class for all NodeLLM errors
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errors occurring during API calls to providers
 */
export class APIError extends LLMError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
    public readonly provider?: string,
    public readonly model?: string
  ) {
    super(message, "API_ERROR");
  }
}

/**
 * 400 - Invalid request parameters
 */
export class BadRequestError extends APIError {
  constructor(message: string, body: unknown, provider?: string, model?: string) {
    super(message, 400, body, provider, model);
    this.name = "BadRequestError";
  }
}

/**
 * 400 - Specifically for context window/token limit issues
 */
export class ContextWindowExceededError extends BadRequestError {
  constructor(message: string, body: unknown, provider?: string, model?: string) {
    super(message, body, provider, model);
    this.name = "ContextWindowExceededError";
  }
}

/**
 * 401 - Invalid or missing API key
 */
export class UnauthorizedError extends APIError {
  constructor(message: string, body: unknown, provider?: string) {
    super(message, 401, body, provider);
    this.name = "UnauthorizedError";
  }
}

/**
 * 402 - Payment required (billing issues)
 */
export class PaymentRequiredError extends APIError {
  constructor(message: string, body: unknown, provider?: string) {
    super(message, 402, body, provider);
    this.name = "PaymentRequiredError";
  }
}

/**
 * 403 - Permission denied
 */
export class ForbiddenError extends APIError {
  constructor(message: string, body: unknown, provider?: string) {
    super(message, 403, body, provider);
    this.name = "ForbiddenError";
  }
}

/**
 * 401/403 - API key or permission issues
 * @deprecated Use UnauthorizedError (401) or ForbiddenError (403) for granular handling
 */
export class AuthenticationError extends APIError {
  constructor(message: string, status: number, body: unknown, provider?: string) {
    super(message, status, body, provider);
    this.name = "AuthenticationError";
  }
}

/**
 * 429 - Rate limit exceeded
 */
export class RateLimitError extends APIError {
  /** Seconds to wait before retrying, parsed from a `Retry-After` response header when present. */
  public retryAfter?: number;

  constructor(
    message: string,
    body: unknown,
    provider?: string,
    model?: string,
    retryAfter?: number
  ) {
    super(message, 429, body, provider, model);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * 429 - Out of credits or monthly quota exceeded
 */
export class InsufficientQuotaError extends RateLimitError {
  constructor(message: string, body: unknown, provider?: string, model?: string) {
    super(message, body, provider, model);
    this.name = "InsufficientQuotaError";
  }
}

/**
 * 500+ - Provider server error
 */
export class ServerError extends APIError {
  constructor(message: string, status: number, body: unknown, provider?: string, model?: string) {
    super(message, status, body, provider, model);
    this.name = "ServerError";
  }
}

/**
 * 502/503/529 - Service overloaded/unavailable
 */
export class ServiceUnavailableError extends ServerError {
  constructor(message: string, status: number, body: unknown, provider?: string, model?: string) {
    super(message, status, body, provider, model);
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Misconfiguration (e.g. missing API key)
 */
export class ConfigurationError extends LLMError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
  }
}

/**
 * Requested model or provider not found
 */
export class NotFoundError extends APIError {
  constructor(
    message: string,
    status: number = 404,
    body: unknown = null,
    provider?: string,
    model?: string
  ) {
    super(message, status, body, provider, model);
    this.name = "NotFoundError";
  }
}

/**
 * Specifically when the requested model ID is invalid/unknown
 */
export class InvalidModelError extends NotFoundError {
  constructor(message: string, body: unknown, provider?: string, model?: string) {
    super(message, 404, body, provider, model);
    this.name = "InvalidModelError";
  }
}

/**
 * Model does not support requested capability
 */
export class CapabilityError extends LLMError {
  constructor(message: string) {
    super(message, "CAPABILITY_ERROR");
  }
}

/**
 * Thrown when LLM provider is not configured
 */
export class ProviderNotConfiguredError extends LLMError {
  constructor() {
    super("LLM provider not configured", "PROVIDER_NOT_CONFIGURED");
  }
}

/**
 * Thrown when a provider doesn't support a requested feature
 */
export class UnsupportedFeatureError extends LLMError {
  constructor(
    public readonly provider: string,
    public readonly feature: string
  ) {
    super(`${provider} does not support ${feature}`, "UNSUPPORTED_FEATURE");
  }
}

/**
 * Thrown when a model doesn't support a requested capability
 */
export class ModelCapabilityError extends LLMError {
  constructor(
    public readonly model: string,
    public readonly capability: string
  ) {
    super(`Model ${model} does not support ${capability}`, "MODEL_CAPABILITY_ERROR");
  }
}
/**
 * Thrown when a tool execution fails
 */
export class ToolError extends LLMError {
  constructor(
    message: string,
    public readonly toolName?: string,
    public readonly fatal: boolean = false
  ) {
    super(message, "TOOL_ERROR");
    this.name = "ToolError";
  }
}
