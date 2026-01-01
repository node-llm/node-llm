import { describe, it, expect } from "vitest";
import { handleAnthropicError } from "../../../../src/providers/anthropic/Errors.js";
import { 
  BadRequestError, 
  AuthenticationError, 
  RateLimitError, 
  ServiceUnavailableError,
  ServerError,
  APIError 
} from "../../../../src/errors/index.js";

describe("Anthropic Errors", () => {
  it("should handle 400 Bad Request", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid request" } }), { status: 400 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(BadRequestError);
  });

  it("should handle 401 Unauthorized", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(AuthenticationError);
  });

  it("should handle 429 Rate Limit", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Too many requests" } }), { status: 429 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(RateLimitError);
  });

  it("should handle 503 Service Unavailable", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Overloaded" } }), { status: 503 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(ServiceUnavailableError);
  });

  it("should handle generic 500 error", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Internal error" } }), { status: 500 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(ServerError);
  });

  it("should handle non-JSON error response", async () => {
    const response = new Response("Plain text error", { status: 404 });
    await expect(handleAnthropicError(response, "test-model")).rejects.toThrow(APIError);
  });
});
