/**
 * Documentation Verification Tests: core-features/middlewares.md
 *
 * Verifies that all code examples from the Middlewares documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry,
  Middleware
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-middlewares", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Basic Usage", () => {
    it("Middleware interface is exported", () => {
      const myMiddleware: Middleware = {
        name: "MyMiddleware",
        onRequest: async (context) => {
          console.log(`[Request] Sending to ${context.model}`);
        },
        onResponse: async (context, result) => {
          console.log(`[Response] Received`);
        }
      };

      expect(myMiddleware.name).toBe("MyMiddleware");
      expect(typeof myMiddleware.onRequest).toBe("function");
      expect(typeof myMiddleware.onResponse).toBe("function");
    });

    it("chat accepts middlewares option", () => {
      const myMiddleware: Middleware = {
        name: "MyMiddleware"
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [myMiddleware]
      });

      expect(chat).toBeDefined();
    });

    it("chat accepts array of middlewares", () => {
      const middleware1: Middleware = { name: "Middleware1" };
      const middleware2: Middleware = { name: "Middleware2" };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware1, middleware2]
      });

      expect(chat).toBeDefined();
    });
  });

  describe("The Middleware Interface", () => {
    it("middleware supports onRequest hook", async () => {
      let requestCalled = false;

      const middleware: Middleware = {
        name: "RequestMiddleware",
        onRequest: async (context) => {
          requestCalled = true;
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware]
      });

      await chat.ask("Test");

      expect(requestCalled).toBe(true);
    });

    it("middleware supports onResponse hook", async () => {
      let responseCalled = false;

      const middleware: Middleware = {
        name: "ResponseMiddleware",
        onResponse: async (context, result) => {
          responseCalled = true;
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware]
      });

      await chat.ask("Test");

      expect(responseCalled).toBe(true);
    });

    it("middleware supports onError hook", () => {
      const middleware: Middleware = {
        name: "ErrorMiddleware",
        onError: async (context, error) => {
          console.error(error.message);
        }
      };

      expect(middleware.onError).toBeDefined();
    });

    it("middleware supports onToolCallStart hook", () => {
      const middleware: Middleware = {
        name: "ToolMiddleware",
        onToolCallStart: async (context, tool) => {
          console.log(`Tool starting: ${tool.function.name}`);
        }
      };

      expect(middleware.onToolCallStart).toBeDefined();
    });

    it("middleware supports onToolCallEnd hook", () => {
      const middleware: Middleware = {
        name: "ToolMiddleware",
        onToolCallEnd: async (context, tool, result) => {
          console.log(`Tool ended`);
        }
      };

      expect(middleware.onToolCallEnd).toBeDefined();
    });

    it("middleware supports onToolCallError hook", () => {
      const middleware: Middleware = {
        name: "ToolMiddleware",
        onToolCallError: async (context, tool, error) => {
          console.error(`Tool error: ${error.message}`);
          return "STOP";
        }
      };

      expect(middleware.onToolCallError).toBeDefined();
    });
  });

  describe("MiddlewareContext", () => {
    it("context provides requestId", async () => {
      let capturedRequestId: string | undefined;

      const middleware: Middleware = {
        name: "ContextMiddleware",
        onRequest: async (context) => {
          capturedRequestId = context.requestId;
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware]
      });

      await chat.ask("Test");

      expect(capturedRequestId).toBeDefined();
      expect(typeof capturedRequestId).toBe("string");
    });

    it("context provides model", async () => {
      let capturedModel: string | undefined;

      const middleware: Middleware = {
        name: "ContextMiddleware",
        onRequest: async (context) => {
          capturedModel = context.model;
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware]
      });

      await chat.ask("Test");

      expect(capturedModel).toBe("fake-model");
    });

    it("context provides state for sharing data between hooks", async () => {
      const middleware: Middleware = {
        name: "StateMiddleware",
        onRequest: async (context) => {
          context.state.startTime = Date.now();
        },
        onResponse: async (context, result) => {
          const latency = Date.now() - (context.state.startTime as number);
          expect(typeof latency).toBe("number");
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [middleware]
      });

      await chat.ask("Test");
    });
  });

  describe("Common Use Cases", () => {
    it("PII Redaction middleware pattern", () => {
      const piiMiddleware: Middleware = {
        name: "PIIRedactor",
        onRequest: async (context) => {
          context.messages.forEach(msg => {
            if (typeof msg.content === "string") {
              msg.content = msg.content.replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, "[REDACTED_CC]");
            }
          });
        }
      };

      expect(piiMiddleware.name).toBe("PIIRedactor");
      expect(piiMiddleware.onRequest).toBeDefined();
    });

    it("Performance Tracking middleware pattern", () => {
      const perfMiddleware: Middleware = {
        name: "PerformanceTracker",
        onRequest: async (context) => {
          context.state.startTime = Date.now();
        },
        onResponse: async (context, result) => {
          const latency = Date.now() - (context.state.startTime as number);
          // In real usage: await db.metrics.create({ model: context.model, latency });
        }
      };

      expect(perfMiddleware.name).toBe("PerformanceTracker");
    });
  });

  describe("Middleware Execution Order", () => {
    it("multiple middlewares execute in correct order", async () => {
      const order: string[] = [];

      const logger: Middleware = {
        name: "Logger",
        onRequest: async () => { order.push("Logger.onRequest"); },
        onResponse: async () => { order.push("Logger.onResponse"); }
      };

      const security: Middleware = {
        name: "Security",
        onRequest: async () => { order.push("Security.onRequest"); },
        onResponse: async () => { order.push("Security.onResponse"); }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        middlewares: [logger, security]
      });

      await chat.ask("Test");

      // onRequest: first to last (Logger -> Security)
      expect(order.indexOf("Logger.onRequest")).toBeLessThan(order.indexOf("Security.onRequest"));
      
      // onResponse: last to first (Security -> Logger)
      expect(order.indexOf("Security.onResponse")).toBeLessThan(order.indexOf("Logger.onResponse"));
    });
  });
});
