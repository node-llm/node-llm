import { describe, it, expect } from "vitest";
import {
  validateBedrockConfig,
  getBedrockEndpoint
} from "../../../../src/providers/bedrock/config.js";

describe("Bedrock Config", () => {
  describe("validateBedrockConfig", () => {
    it("should return 'apiKey' when apiKey is provided", () => {
      const result = validateBedrockConfig({
        region: "us-east-1",
        apiKey: "test-api-key"
      });
      expect(result).toBe("apiKey");
    });

    it("should return 'sigv4' when access key and secret are provided", () => {
      const result = validateBedrockConfig({
        region: "us-east-1",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      });
      expect(result).toBe("sigv4");
    });

    it("should throw when region is missing", () => {
      expect(() =>
        validateBedrockConfig({
          region: "",
          apiKey: "test-api-key"
        })
      ).toThrow("region is required");
    });

    it("should throw when no auth is provided", () => {
      expect(() =>
        validateBedrockConfig({
          region: "us-east-1"
        })
      ).toThrow("provide either apiKey OR accessKeyId/secretAccessKey");
    });

    it("should throw when both auth methods are provided", () => {
      expect(() =>
        validateBedrockConfig({
          region: "us-east-1",
          apiKey: "test-api-key",
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        })
      ).toThrow("provide either apiKey OR accessKeyId/secretAccessKey, not both");
    });
  });

  describe("getBedrockEndpoint", () => {
    it("should return correct endpoint for us-east-1", () => {
      expect(getBedrockEndpoint("us-east-1")).toBe(
        "https://bedrock-runtime.us-east-1.amazonaws.com"
      );
    });

    it("should return correct endpoint for us-west-2", () => {
      expect(getBedrockEndpoint("us-west-2")).toBe(
        "https://bedrock-runtime.us-west-2.amazonaws.com"
      );
    });

    it("should return correct endpoint for eu-west-1", () => {
      expect(getBedrockEndpoint("eu-west-1")).toBe(
        "https://bedrock-runtime.eu-west-1.amazonaws.com"
      );
    });
  });
});
