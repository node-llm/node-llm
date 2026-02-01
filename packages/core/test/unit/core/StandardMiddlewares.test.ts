import { describe, it, expect, vi } from "vitest";
import { PIIMaskMiddleware } from "../../../src/middlewares/PIIMaskMiddleware.js";
import { CostGuardMiddleware } from "../../../src/middlewares/CostGuardMiddleware.js";
import { UsageLoggerMiddleware } from "../../../src/middlewares/UsageLoggerMiddleware.js";
import { MiddlewareContext } from "../../../src/types/Middleware.js";
import { ChatResponseString } from "../../../src/chat/ChatResponse.js";
import { Message } from "../../../src/chat/Message.js";

describe("Standard Middlewares", () => {
  const mockCtx = (messages: Message[] = []): MiddlewareContext => ({
    requestId: "test-id",
    provider: "test-provider",
    model: "test-model",
    messages,
    state: {}
  });

  describe("PIIMaskMiddleware", () => {
    it("should redact sensitive info from string content", async () => {
      const middleware = new PIIMaskMiddleware();
      const messages: Message[] = [
        { role: "user", content: "My email is test@example.com and phone is 123-456-7890" }
      ];
      const ctx = mockCtx(messages);

      await middleware.onRequest!(ctx);

      expect(messages[0].content).toBe("My email is [REDACTED] and phone is [REDACTED]");
    });

    it("should redact from multimodal content parts", async () => {
      const middleware = new PIIMaskMiddleware({ mask: "XXX" });
      const messages: Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Contact me at ssn 123-45-6789" }]
        }
      ];
      const ctx = mockCtx(messages);

      await middleware.onRequest!(ctx);

      expect((messages[0].content as any)[0].text).toBe("Contact me at ssn XXX");
    });
  });

  describe("CostGuardMiddleware", () => {
    it("should allow requests under the budget", async () => {
      const middleware = new CostGuardMiddleware({ maxCost: 0.1 });
      const ctx = mockCtx();
      const response = new ChatResponseString(
        "hi",
        { input_tokens: 1, output_tokens: 1, total_tokens: 2, cost: 0.05 },
        "m",
        "p"
      );

      await expect(middleware.onResponse!(ctx, response)).resolves.not.toThrow();
    });

    it("should throw when budget is exceeded", async () => {
      const onLimit = vi.fn();
      const middleware = new CostGuardMiddleware({ maxCost: 0.01, onLimitExceeded: onLimit });
      const ctx = mockCtx();

      const response1 = new ChatResponseString(
        "hi",
        { input_tokens: 1, output_tokens: 1, total_tokens: 2, cost: 0.006 },
        "m",
        "p"
      );
      const response2 = new ChatResponseString(
        "hi",
        { input_tokens: 1, output_tokens: 1, total_tokens: 2, cost: 0.005 },
        "m",
        "p"
      );

      await middleware.onResponse!(ctx, response1);
      await expect(middleware.onResponse!(ctx, response2)).rejects.toThrow("Budget exceeded");
      expect(onLimit).toHaveBeenCalled();
    });
  });

  describe("UsageLoggerMiddleware", () => {
    it("should call custom logger with structured data", async () => {
      const customLog = vi.fn();
      const middleware = new UsageLoggerMiddleware({ logger: customLog, prefix: "Audit" });
      const ctx = mockCtx();
      const response = new ChatResponseString(
        "hi",
        {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
          cost: 0.0001
        },
        "m",
        "p"
      );

      await middleware.onResponse!(ctx, response);

      expect(customLog).toHaveBeenCalledWith(
        expect.stringContaining("[Audit] LLM Usage"),
        expect.objectContaining({
          tokens: expect.objectContaining({ input: 10, output: 20 })
        })
      );
    });
  });
});
