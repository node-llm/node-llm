import { describe, it, expect, vi } from "vitest";
import { Provider } from "../../../src/providers/Provider.js";
import {
  LLMError,
  APIError,
  RateLimitError,
  AuthenticationError,
  BadRequestError,
  ServerError
} from "../../../src/errors/index.js";
import { Executor } from "../../../src/executor/Executor.js";
import { handleOpenAIError } from "../../../src/providers/openai/Errors.js";

describe("Error System", () => {
  describe("Hierarchy", () => {
    it("should maintain proper inheritance", () => {
      const error = new RateLimitError(
        "Too many requests",
        { detail: "limit exceeded" },
        "openai",
        "gpt-4"
      );

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(LLMError);
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(429);
      expect(error.provider).toBe("openai");
    });
  });

  describe("Executor Retry Logic", () => {
    it("should retry on RateLimitError", async () => {
      let attempts = 0;
      const mockProvider = {
        chat: vi.fn().mockImplementation(async () => {
          attempts++;
          if (attempts < 2) {
            throw new RateLimitError("Rate limited", {});
          }
          return { content: "Success" };
        })
      };

      const executor = new Executor(mockProvider as unknown as Provider, { attempts: 3, delayMs: 0 });
      const result = await executor.executeChat({ model: "test", messages: [] });

      expect(result.content).toBe("Success");
      expect(attempts).toBe(2);
      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it("should NOT retry on AuthenticationError", async () => {
      let attempts = 0;
      const mockProvider = {
        chat: vi.fn().mockImplementation(async () => {
          attempts++;
          throw new AuthenticationError("Invalid key", 401, {});
        })
      };

      const executor = new Executor(mockProvider as unknown as Provider, { attempts: 3, delayMs: 0 });

      await expect(executor.executeChat({ model: "test", messages: [] })).rejects.toThrow(
        AuthenticationError
      );

      expect(attempts).toBe(1); // Should fail fast
    });

    it("should NOT retry on BadRequestError", async () => {
      let attempts = 0;
      const mockProvider = {
        chat: vi.fn().mockImplementation(async () => {
          attempts++;
          throw new BadRequestError("Invalid params", {});
        })
      };

      const executor = new Executor(mockProvider as unknown as Provider, { attempts: 3, delayMs: 0 });

      await expect(executor.executeChat({ model: "test", messages: [] })).rejects.toThrow(
        BadRequestError
      );

      expect(attempts).toBe(1);
    });
  });

  describe("OpenAI Error Mapper", () => {
    const mockResponse = (status: number, body: unknown) =>
      ({
        status,
        ok: false,
        json: async () => body,
        text: async () => JSON.stringify(body)
      }) as Response;

    it("should map 401 to AuthenticationError", async () => {
      const response = mockResponse(401, { error: { message: "Invalid API Key" } });
      await expect(handleOpenAIError(response)).rejects.toThrow(AuthenticationError);
    });

    it("should map 429 to RateLimitError", async () => {
      const response = mockResponse(429, { error: { message: "Quota exceeded" } });
      await expect(handleOpenAIError(response)).rejects.toThrow(RateLimitError);
    });

    it("should map 500 to ServerError", async () => {
      const response = mockResponse(500, { error: { message: "Internal crash" } });
      await expect(handleOpenAIError(response)).rejects.toThrow(ServerError);
    });

    it("should extract message from OpenAI error body", async () => {
      const response = mockResponse(400, { error: { message: "Custom OpenAI message" } });
      try {
        await handleOpenAIError(response);
      } catch (e) {
        expect((e as Error).message).toBe("Custom OpenAI message");
        expect(e).toBeInstanceOf(BadRequestError);
      }
    });
  });
});
