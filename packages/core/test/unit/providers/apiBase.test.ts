import { describe, it, expect } from "vitest";
import { checkApiBase, OPENAI_COMPATIBLE_ENDPOINTS } from "../../../src/providers/apiBase.js";
import { ConfigurationError } from "../../../src/errors/index.js";
import { createLLM } from "../../../src/llm.js";

const opts = { example: "https://api.openai.com/v1", endpoints: OPENAI_COMPATIBLE_ENDPOINTS };

describe("checkApiBase", () => {
  it("returns a valid base URL unchanged", () => {
    expect(checkApiBase("openaiApiBase", "https://api.groq.com/openai/v1", opts)).toBe(
      "https://api.groq.com/openai/v1"
    );
    expect(checkApiBase("openaiApiBase", "http://localhost:4000/v1/", opts)).toBe(
      "http://localhost:4000/v1/"
    );
  });

  it("returns undefined when nothing is set", () => {
    expect(checkApiBase("openaiApiBase", undefined, opts)).toBeUndefined();
    expect(checkApiBase("openaiApiBase", "", opts)).toBeUndefined();
  });

  it.each([
    ["https://api.openai.com/v1/chat/completions", "/chat/completions"],
    ["https://api.openai.com/v1/chat/completions/", "/chat/completions"],
    ["https://api.openai.com/v1/responses?x=1", "/responses"],
    ["https://api.openai.com/v1/embeddings", "/embeddings"]
  ])("rejects %s, naming the endpoint path", (url, endpoint) => {
    expect(() => checkApiBase("openaiApiBase", url, opts)).toThrow(ConfigurationError);
    expect(() => checkApiBase("openaiApiBase", url, opts)).toThrow(`(without ${endpoint})`);
  });

  it("rejects a URL without an http(s) scheme", () => {
    expect(() => checkApiBase("openaiApiBase", "api.openai.com/v1", opts)).toThrow(
      "starting with http:// or https://"
    );
  });

  it("checks base URLs when a provider is created", () => {
    expect(() =>
      createLLM({
        provider: "anthropic",
        anthropicApiKey: "test",
        anthropicApiBase: "https://api.anthropic.com/v1/messages"
      })
    ).toThrow("anthropicApiBase should look like");
  });

  it("passes the Anthropic base URL to the provider", () => {
    const llm = createLLM({
      provider: "anthropic",
      anthropicApiKey: "test",
      anthropicApiBase: "https://proxy.example.com/v1"
    });
    expect(llm.chat("claude-sonnet-5").provider.apiBase()).toBe("https://proxy.example.com/v1");
  });
});
