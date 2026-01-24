import { describe, it, expect } from "vitest";
import { signRequest, AwsCredentials } from "../../../src/utils/AwsSigV4.js";

describe("AwsSigV4", () => {
  // Fixed test credentials (never use real credentials in tests)
  const testCredentials: AwsCredentials = {
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  };

  // Fixed timestamp for deterministic testing
  const fixedTimestamp = new Date("2026-01-23T17:45:00.000Z");

  describe("signRequest", () => {
    it("should return all required headers", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: '{"messages":[]}',
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      // Verify all required headers are present
      expect(result).toHaveProperty("host");
      expect(result).toHaveProperty("x-amz-date");
      expect(result).toHaveProperty("x-amz-content-sha256");
      expect(result).toHaveProperty("authorization");
    });

    it("should compute correct x-amz-date format", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: '{"messages":[]}',
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      // AWS date format: YYYYMMDD'T'HHMMSS'Z'
      expect(result["x-amz-date"]).toBe("20260123T174500Z");
    });

    it("should compute correct x-amz-content-sha256", () => {
      const body = '{"messages":[]}';
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body,
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      // SHA256 hash of the body (can be verified with: echo -n '{"messages":[]}' | shasum -a 256)
      expect(result["x-amz-content-sha256"]).toBe(
        "5e4ce7b36ba37b78a5d5f9fd08e6b7b54ba6879d651aa46ec9e1d6fa24ebe30a"
      );
    });

    it("should extract host correctly from URL", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-west-2.amazonaws.com/model/anthropic.claude-3-5-haiku-20241022-v1:0/converse",
        body: "{}",
        credentials: testCredentials,
        region: "us-west-2",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      expect(result.host).toBe("bedrock-runtime.us-west-2.amazonaws.com");
    });

    it("should build proper authorization header structure", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: '{"messages":[]}',
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      const auth = result.authorization;

      // Check structure: AWS4-HMAC-SHA256 Credential=..., SignedHeaders=..., Signature=...
      expect(auth).toMatch(/^AWS4-HMAC-SHA256 /);
      expect(auth).toContain(
        "Credential=AKIAIOSFODNN7EXAMPLE/20260123/us-east-1/bedrock/aws4_request"
      );
      expect(auth).toContain("SignedHeaders=host;x-amz-content-sha256;x-amz-date");
      expect(auth).toMatch(/Signature=[a-f0-9]{64}$/);
    });

    it("should include session token header when provided", () => {
      const credentialsWithToken: AwsCredentials = {
        ...testCredentials,
        sessionToken: "FwoGZXIvYXdzEBYaDG..."
      };

      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: "{}",
        credentials: credentialsWithToken,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      expect(result["x-amz-security-token"]).toBe("FwoGZXIvYXdzEBYaDG...");
      // Session token should also be in signed headers
      expect(result.authorization).toContain("x-amz-security-token");
    });

    it("should NOT include session token header when not provided", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: "{}",
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      expect(result["x-amz-security-token"]).toBeUndefined();
      expect(result.authorization).not.toContain("x-amz-security-token");
    });

    it("should produce deterministic signatures for same inputs", () => {
      const options = {
        method: "POST" as const,
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: '{"test":"data"}',
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      };

      const result1 = signRequest(options);
      const result2 = signRequest(options);

      expect(result1.authorization).toBe(result2.authorization);
      expect(result1["x-amz-content-sha256"]).toBe(result2["x-amz-content-sha256"]);
    });

    it("should produce different signatures for different bodies", () => {
      const baseOptions = {
        method: "POST" as const,
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      };

      const result1 = signRequest({ ...baseOptions, body: '{"a":"1"}' });
      const result2 = signRequest({ ...baseOptions, body: '{"a":"2"}' });

      expect(result1.authorization).not.toBe(result2.authorization);
      expect(result1["x-amz-content-sha256"]).not.toBe(result2["x-amz-content-sha256"]);
    });

    it("should produce different signatures for different regions", () => {
      const baseOptions = {
        method: "POST" as const,
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: "{}",
        credentials: testCredentials,
        service: "bedrock",
        timestamp: fixedTimestamp
      };

      const result1 = signRequest({ ...baseOptions, region: "us-east-1" });
      const result2 = signRequest({ ...baseOptions, region: "us-west-2" });

      expect(result1.authorization).not.toBe(result2.authorization);
    });

    it("should work with GET method and empty body", () => {
      const result = signRequest({
        method: "GET",
        url: "https://bedrock.us-east-1.amazonaws.com/foundation-models",
        body: "",
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      expect(result).toHaveProperty("authorization");
      // Empty body should have a specific SHA256 hash
      expect(result["x-amz-content-sha256"]).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
    });
  });

  describe("authorization header format", () => {
    it("should have signed headers in alphabetical order", () => {
      const result = signRequest({
        method: "POST",
        url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/test-model/converse",
        body: "{}",
        credentials: testCredentials,
        region: "us-east-1",
        service: "bedrock",
        timestamp: fixedTimestamp
      });

      // Extract SignedHeaders from authorization
      const match = result.authorization.match(/SignedHeaders=([^,]+)/);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBeDefined();

      const signedHeaders = match![1]!.split(";");
      const sortedHeaders = [...signedHeaders].sort();

      expect(signedHeaders).toEqual(sortedHeaders);
    });
  });
});
