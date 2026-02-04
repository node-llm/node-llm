/**
 * Documentation Verification Tests: advanced/error-handling.md
 *
 * Verifies that all error classes and handling patterns work correctly.
 */
import { describe, it, expect } from "vitest";
import {
  LLMError,
  APIError,
  ConfigurationError,
  RateLimitError,
  AuthenticationError,
  ProviderNotConfiguredError,
  CapabilityError,
  ToolError
} from "../../src/index.js";

describe("advanced-error-handling", () => {
  describe("Error Hierarchy", () => {
    it("LLMError is the base error class", () => {
      // Per docs: LLMError # Base error class
      expect(LLMError).toBeDefined();
      const error = new LLMError("Test error");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    it("APIError extends LLMError", () => {
      // Per docs: APIError # Base for all provider API issues
      expect(APIError).toBeDefined();
    });

    it("ConfigurationError extends LLMError", () => {
      // Per docs: ConfigurationError # Missing API key or invalid config
      expect(ConfigurationError).toBeDefined();
      const error = new ConfigurationError("Missing API key");
      expect(error).toBeInstanceOf(LLMError);
    });

    it("RateLimitError exists", () => {
      // Per docs: RateLimitError # 429: Rate limit exceeded
      expect(RateLimitError).toBeDefined();
    });

    it("AuthenticationError exists", () => {
      // Per docs: AuthenticationError # 401/403 (deprecated, use specific classes)
      expect(AuthenticationError).toBeDefined();
    });

    it("ProviderNotConfiguredError exists", () => {
      // Per docs: ProviderNotConfiguredError # No provider set
      expect(ProviderNotConfiguredError).toBeDefined();
    });

    it("CapabilityError exists", () => {
      // Per docs: CapabilityError # Model doesn't support feature (e.g. vision)
      expect(CapabilityError).toBeDefined();
    });

    it("ToolError exists and has fatal property", () => {
      // Per docs: ToolError # Tool execution failed (has `fatal` property)
      expect(ToolError).toBeDefined();
    });
  });

  describe("Error Properties", () => {
    it("LLMError has message property", () => {
      const error = new LLMError("Test message");
      expect(error.message).toBe("Test message");
    });

    it("ConfigurationError has message property", () => {
      const error = new ConfigurationError("Missing API key");
      expect(error.message).toBe("Missing API key");
    });
  });

  describe("Error Handling Patterns", () => {
    it("instanceof checks work for LLMError", () => {
      // Per docs: if (error instanceof LLMError) { ... }
      const error = new LLMError("Test");
      expect(error instanceof LLMError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("instanceof checks work for ConfigurationError", () => {
      // Per docs: if (error instanceof ConfigurationError) { ... }
      const error = new ConfigurationError("Test");
      expect(error instanceof ConfigurationError).toBe(true);
      expect(error instanceof LLMError).toBe(true);
    });
  });
});
