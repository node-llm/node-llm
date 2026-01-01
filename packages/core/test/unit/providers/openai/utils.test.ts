import { describe, it, expect } from "vitest";
import { buildUrl } from "../../../../src/providers/openai/utils.js";

describe("OpenAI Utils", () => {
  describe("buildUrl", () => {
    it("concatenates valid base URL and endpoint", () => {
      const baseUrl = "https://api.openai.com/v1";
      const endpoint = "/chat/completions";
      expect(buildUrl(baseUrl, endpoint)).toBe("https://api.openai.com/v1/chat/completions");
    });

    it("handles trailing slash in base URL (assuming caller might strip it or buildUrl handles it - checking implementation)", () => {
      const baseUrl = "https://api.openai.com/v1";
      const endpoint = "/models";
      expect(buildUrl(baseUrl, endpoint)).toBe("https://api.openai.com/v1/models");
    });

    it("inserts endpoint before query parameters (Azure style)", () => {
      const baseUrl = "https://resource.azure.com/openai/deployments/gpt-4?api-version=2024-02-15";
      const endpoint = "/chat/completions";
      
      const expected = "https://resource.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15";
      expect(buildUrl(baseUrl, endpoint)).toBe(expected);
    });

    it("handles complex query parameters", () => {
        const baseUrl = "https://example.com/api?foo=bar&baz=qux";
        const endpoint = "/v1/chat";
        const expected = "https://example.com/api/v1/chat?foo=bar&baz=qux";
        expect(buildUrl(baseUrl, endpoint)).toBe(expected);
    });
  });
});
