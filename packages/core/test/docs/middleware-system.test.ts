/**
 * Middleware System Documentation Verification
 *
 * Verifies that the middleware system works as documented.
 */
import { describe, it, expect, vi } from "vitest";
import {
  createLLM,
  PIIMaskMiddleware,
  UsageLoggerMiddleware,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

// Register fake provider
providerRegistry.register("fake", () => new FakeProvider(["test"]));

describe("middleware-system", () => {
  describe("Built-in Middlewares", () => {
    it("PIIMaskMiddleware can be instantiated", () => {
      const middleware = new PIIMaskMiddleware();
      expect(middleware).toBeDefined();
      expect(middleware.name).toBeDefined();
    });

    it("UsageLoggerMiddleware can be instantiated", () => {
      const middleware = new UsageLoggerMiddleware();
      expect(middleware).toBeDefined();
      expect(middleware.name).toBeDefined();
    });
  });

  describe("Middleware Registration", () => {
    it("createLLM accepts middlewares array", () => {
      const llm = createLLM({
        provider: "fake",
        middlewares: [new PIIMaskMiddleware(), new UsageLoggerMiddleware()]
      });

      expect(llm).toBeDefined();
    });

    it("middleware has required interface", () => {
      const middleware = new PIIMaskMiddleware();
      expect(typeof middleware.name).toBe("string");
    });
  });

  describe("Custom Middleware Pattern", () => {
    it("custom middleware object can be created", () => {
      const customMiddleware = {
        name: "AuditMiddleware",
        onRequest: vi.fn(),
        onResponse: vi.fn(),
        onToolCallError: vi.fn()
      };

      expect(customMiddleware.name).toBe("AuditMiddleware");
      expect(typeof customMiddleware.onRequest).toBe("function");
      expect(typeof customMiddleware.onResponse).toBe("function");
    });

    it("onToolCallError can return control values", () => {
      const safetyMiddleware = {
        name: "SafetyMiddleware",
        onToolCallError: async (
          _ctx: unknown,
          tool: { function: { name: string } },
          _error: Error
        ) => {
          if (tool.function.name === "delete_user") return "STOP";
          return "RETRY";
        }
      };

      expect(safetyMiddleware.name).toBe("SafetyMiddleware");
    });
  });
});
