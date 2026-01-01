import { describe, it, expect } from "vitest";
import { handleGeminiError } from "../../../../src/providers/gemini/Errors.js";
import { 
  BadRequestError, 
  AuthenticationError, 
  RateLimitError, 
  ServiceUnavailableError,
  ServerError,
  APIError 
} from "../../../../src/errors/index.js";

describe("Gemini Errors", () => {
  it("should handle 400 Bad Request", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid argument" } }), { status: 400 });
    await expect(handleGeminiError(response, "test-model")).rejects.toThrow(BadRequestError);
  });

  it("should handle 401 Unauthorized", async () => {
    const response = new Response(JSON.stringify({ error: { message: "API key not valid" } }), { status: 401 });
    await expect(handleGeminiError(response, "test-model")).rejects.toThrow(AuthenticationError);
  });

  it("should handle 429 Rate Limit", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Resource exhausted" } }), { status: 429 });
    await expect(handleGeminiError(response, "test-model")).rejects.toThrow(RateLimitError);
  });

  it("should handle 503 Service Unavailable", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Service unavailable" } }), { status: 503 });
    await expect(handleGeminiError(response, "test-model")).rejects.toThrow(ServiceUnavailableError);
  });

  it("should handle generic 500 error", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Internal error" } }), { status: 500 });
    await expect(handleGeminiError(response, "test-model")).rejects.toThrow(ServerError);
  });
});
