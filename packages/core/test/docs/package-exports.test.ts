/**
 * Package Exports Verification Tests
 *
 * Verifies that all exports documented in README.md actually exist.
 */
import { describe, it, expect } from "vitest";

describe("package-exports", () => {
  describe("Main Package", () => {
    it("exports NodeLLM class", async () => {
      const { NodeLLM } = await import("../../src/index.js");
      expect(NodeLLM).toBeDefined();
      expect(typeof NodeLLM.chat).toBe("function");
    });

    it("exports LegacyNodeLLM class", async () => {
      const { LegacyNodeLLM } = await import("../../src/index.js");
      expect(LegacyNodeLLM).toBeDefined();
    });

    it("exports createLLM factory", async () => {
      const { createLLM } = await import("../../src/index.js");
      expect(typeof createLLM).toBe("function");
    });

    it("exports NodeLLMCore class", async () => {
      const { NodeLLMCore } = await import("../../src/index.js");
      expect(NodeLLMCore).toBeDefined();
    });

    it("exports config object", async () => {
      const { config } = await import("../../src/index.js");
      expect(config).toBeDefined();
    });

    it("exports Schema class", async () => {
      const { Schema } = await import("../../src/index.js");
      expect(Schema).toBeDefined();
    });

    it("exports z (zod)", async () => {
      const { z } = await import("../../src/index.js");
      expect(z).toBeDefined();
      expect(typeof z.object).toBe("function");
      expect(typeof z.string).toBe("function");
    });
  });

  describe("Chat Classes", () => {
    it("exports Chat class", async () => {
      const { Chat } = await import("../../src/index.js");
      expect(Chat).toBeDefined();
    });

    it("exports ChatStream class", async () => {
      const { ChatStream } = await import("../../src/index.js");
      expect(ChatStream).toBeDefined();
    });
  });

  describe("Tool System", () => {
    it("exports Tool base class", async () => {
      const { Tool } = await import("../../src/index.js");
      expect(Tool).toBeDefined();
    });

    it("exports ToolExecutionMode enum", async () => {
      const { ToolExecutionMode } = await import("../../src/index.js");
      expect(ToolExecutionMode).toBeDefined();
    });

    it("exports tool constants", async () => {
      const { DEFAULT_MAX_TOOL_CALLS, DEFAULT_MAX_RETRIES } = await import(
        "../../src/index.js"
      );
      expect(typeof DEFAULT_MAX_TOOL_CALLS).toBe("number");
      expect(typeof DEFAULT_MAX_RETRIES).toBe("number");
    });
  });

  describe("Provider System", () => {
    it("exports BaseProvider class", async () => {
      const { BaseProvider } = await import("../../src/index.js");
      expect(BaseProvider).toBeDefined();
    });

    it("exports providerRegistry", async () => {
      const { providerRegistry } = await import("../../src/index.js");
      expect(providerRegistry).toBeDefined();
    });

    it("exports ModelRegistry", async () => {
      const { ModelRegistry } = await import("../../src/index.js");
      expect(ModelRegistry).toBeDefined();
    });

    it("exports PricingRegistry", async () => {
      const { PricingRegistry } = await import("../../src/index.js");
      expect(PricingRegistry).toBeDefined();
    });
  });

  describe("Capabilities", () => {
    it("exports Transcription", async () => {
      const { Transcription } = await import("../../src/index.js");
      expect(Transcription).toBeDefined();
    });

    it("exports Moderation", async () => {
      const { Moderation } = await import("../../src/index.js");
      expect(Moderation).toBeDefined();
    });

    it("exports Embedding", async () => {
      const { Embedding } = await import("../../src/index.js");
      expect(Embedding).toBeDefined();
    });
  });

  describe("Middleware System", () => {
    it("exports PIIMaskMiddleware", async () => {
      const { PIIMaskMiddleware } = await import("../../src/index.js");
      expect(PIIMaskMiddleware).toBeDefined();
    });

    it("exports UsageLoggerMiddleware", async () => {
      const { UsageLoggerMiddleware } = await import("../../src/index.js");
      expect(UsageLoggerMiddleware).toBeDefined();
    });
  });

  describe("Error Classes", () => {
    it("exports LLMError base class", async () => {
      const { LLMError } = await import("../../src/index.js");
      expect(LLMError).toBeDefined();
    });

    it("exports APIError class", async () => {
      const { APIError } = await import("../../src/index.js");
      expect(APIError).toBeDefined();
    });

    it("exports specific error classes", async () => {
      const {
        ConfigurationError,
        RateLimitError,
        AuthenticationError,
        ProviderNotConfiguredError
      } = await import("../../src/index.js");

      expect(ConfigurationError).toBeDefined();
      expect(RateLimitError).toBeDefined();
      expect(AuthenticationError).toBeDefined();
      expect(ProviderNotConfiguredError).toBeDefined();
    });
  });

  describe("Utilities", () => {
    it("exports resolveModelAlias function", async () => {
      const { resolveModelAlias } = await import("../../src/index.js");
      expect(typeof resolveModelAlias).toBe("function");
    });

    it("exports MODEL_ALIASES", async () => {
      const { MODEL_ALIASES } = await import("../../src/index.js");
      expect(MODEL_ALIASES).toBeDefined();
    });

    it("exports fetchWithTimeout", async () => {
      const { fetchWithTimeout } = await import("../../src/index.js");
      expect(typeof fetchWithTimeout).toBe("function");
    });
  });
});
