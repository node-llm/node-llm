import { describe, it, expect } from "vitest";
import { handleOpenAIError } from "../../../../src/providers/openai/Errors.js";
import { 
  BadRequestError, 
  AuthenticationError, 
  RateLimitError, 
  ServiceUnavailableError,
  ServerError,
  APIError 
} from "../../../../src/errors/index.js";

describe("OpenAI Errors", () => {
  it("should handle 400 Bad Request", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid parameter" } }), { status: 400 });
    await expect(handleOpenAIError(response, "test-model")).rejects.toThrow(BadRequestError);
  });

  it("should handle 401 Unauthorized", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Incorrect API key" } }), { status: 401 });
    await expect(handleOpenAIError(response, "test-model")).rejects.toThrow(AuthenticationError);
  });

  it("should handle 429 Rate Limit", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), { status: 429 });
    await expect(handleOpenAIError(response, "test-model")).rejects.toThrow(RateLimitError);
  });

  it("should handle generic 500 error", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Internal server error" } }), { status: 500 });
    await expect(handleOpenAIError(response, "test-model")).rejects.toThrow(ServerError);
  });
});
