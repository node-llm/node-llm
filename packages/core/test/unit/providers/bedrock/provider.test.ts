import { describe, it, expect } from "vitest";
import { BedrockProvider } from "../../../../src/providers/bedrock/BedrockProvider.js";

describe("BedrockProvider", () => {
  describe("constructor", () => {
    it("should create provider with API key auth", () => {
      const provider = new BedrockProvider({
        region: "us-east-1",
        apiKey: "test-api-key"
      });

      expect(provider.id).toBe("bedrock");
      expect(provider.apiBase()).toBe("https://bedrock-runtime.us-east-1.amazonaws.com");
    });

    it("should create provider with SigV4 auth", () => {
      const provider = new BedrockProvider({
        region: "us-west-2",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      });

      expect(provider.id).toBe("bedrock");
      expect(provider.apiBase()).toBe("https://bedrock-runtime.us-west-2.amazonaws.com");
    });
  });

  describe("defaultModel", () => {
    it("should return Nova Lite as default", () => {
      const provider = new BedrockProvider({
        region: "us-east-1",
        apiKey: "test-api-key"
      });

      expect(provider.defaultModel()).toBe("amazon.nova-lite-v1:0");
    });
  });

  describe("capabilities", () => {
    const provider = new BedrockProvider({
      region: "us-east-1",
      apiKey: "test-api-key"
    });

    it("should support vision for Claude models", () => {
      expect(
        provider.capabilities?.supportsVision("anthropic.claude-3-5-sonnet-20241022-v2:0")
      ).toBe(true);
      expect(provider.capabilities?.supportsVision("deepseek.v3-v1:0")).toBe(false);
    });

    it("should support tools for Claude models", () => {
      expect(provider.capabilities?.supportsTools("anthropic.claude-3-5-haiku-20241022-v1:0")).toBe(
        true
      );
    });

    it("should NOT support tools for Mistral models", () => {
      // Bedrock Converse API only confirms Claude tool support
      expect(provider.capabilities?.supportsTools("mistral.mistral-large-2407-v1:0")).toBe(false);
    });

    it("should support reasoning for Claude 3.7", () => {
      expect(
        provider.capabilities?.supportsReasoning("anthropic.claude-3-7-sonnet-20250219-v1:0")
      ).toBe(true);
      expect(
        provider.capabilities?.supportsReasoning("anthropic.claude-3-5-haiku-20241022-v1:0")
      ).toBe(false);
    });

    it("should return context window for Claude models", () => {
      expect(
        provider.capabilities?.getContextWindow("anthropic.claude-3-5-sonnet-20241022-v2:0")
      ).toBe(200000);
    });

    it("should return context window for DeepSeek models", () => {
      expect(provider.capabilities?.getContextWindow("deepseek.v3-v1:0")).toBe(163840);
    });
  });

  describe("formatToolResultMessage", () => {
    it("should format tool result message correctly", () => {
      const provider = new BedrockProvider({
        region: "us-east-1",
        apiKey: "test-api-key"
      });

      const message = provider.formatToolResultMessage("call_123", "Result data");

      expect(message.role).toBe("tool");
      expect(message.tool_call_id).toBe("call_123");
      expect(message.content).toBe("Result data");
    });

    it("should format error tool result correctly", () => {
      const provider = new BedrockProvider({
        region: "us-east-1",
        apiKey: "test-api-key"
      });

      const message = provider.formatToolResultMessage("call_456", "Error occurred", {
        isError: true
      });

      expect(message.isError).toBe(true);
    });
  });
});
