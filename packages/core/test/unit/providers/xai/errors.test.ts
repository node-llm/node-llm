import { describe, it, expect } from "vitest";
import { handleXAIError } from "../../../../src/providers/xai/Errors.js";
import {
  BadRequestError,
  AuthenticationError,
  RateLimitError,
  ServerError,
  NotFoundError
} from "../../../../src/errors/index.js";

describe("xAI Errors", () => {
  it("should handle 400 Bad Request", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid parameter" } }), {
      status: 400
    });
    await expect(handleXAIError(response, "grok-3")).rejects.toThrow(BadRequestError);
  });

  it("should handle 401 Unauthorized", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Incorrect API key" } }), {
      status: 401
    });
    await expect(handleXAIError(response, "grok-3")).rejects.toThrow(AuthenticationError);
  });

  it("should handle 404 Not Found", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Model not found" } }), {
      status: 404
    });
    await expect(handleXAIError(response, "grok-unknown")).rejects.toThrow(NotFoundError);
  });

  it("should handle 429 Rate Limit", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), {
      status: 429
    });
    await expect(handleXAIError(response, "grok-3")).rejects.toThrow(RateLimitError);
  });

  it("should handle 500 server error", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Internal server error" } }), {
      status: 500
    });
    await expect(handleXAIError(response, "grok-3")).rejects.toThrow(ServerError);
  });

  it("should handle 503 service unavailable", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Service unavailable" } }), {
      status: 503
    });
    await expect(handleXAIError(response, "grok-3")).rejects.toThrow(ServerError);
  });
});
