import { describe, it, expect, vi, afterEach } from "vitest";
import { redactForLog, redactSecrets } from "../../../src/utils/redact.js";
import { logger } from "../../../src/utils/logger.js";
import { config } from "../../../src/config.js";
import { APIError, RateLimitError } from "../../../src/errors/index.js";

const keys = [
  "sk-proj-abcdefghijklmnopqrstuvwx",
  "sk-ant-api03-abcdefghijklmnopqrstuvwx",
  "sk-or-v1-0123456789abcdef0123",
  "AIzaSyA1234567890abcdefghijklmnopqrstu",
  "AKIAABCDEFGHIJKLMNOP",
  "Bearer abcdefghijklmnopqrstuvwxyz"
];

describe("redactForLog", () => {
  it("masks key-like values and secret fields, keeping the prompt", () => {
    for (const key of keys.slice(0, -1))
      expect(redactSecrets(`using ${key} now`)).toBe("using [REDACTED] now");
    expect(redactSecrets(`using ${keys.at(-1)} now`)).toBe("using Bearer [REDACTED] now");
    expect(
      redactForLog({
        messages: [{ role: "user", content: "What is 2+2?" }],
        api_key: "anything",
        headers: { Authorization: "x", "x-goog-api-key": "y" }
      })
    ).toEqual({
      messages: [{ role: "user", content: "What is 2+2?" }],
      api_key: "[REDACTED]",
      headers: { Authorization: "[REDACTED]", "x-goog-api-key": "[REDACTED]" }
    });
  });

  it("replaces base64 files with their size", () => {
    const base64 = "A".repeat(400);
    expect(redactForLog({ url: `data:image/png;base64,${base64}` })).toEqual({
      url: "data:image/png;base64,[422 chars]"
    });
    expect(redactForLog({ inlineData: { mimeType: "application/pdf", data: base64 } })).toEqual({
      inlineData: { mimeType: "application/pdf", data: "[400 chars of base64]" }
    });
  });

  it("leaves short and ordinary values alone", () => {
    const body = { model: "gpt-5", max_tokens: 100, data: "abc", tools: [{ name: "sk-tool" }] };
    expect(redactForLog(body)).toEqual(body);
  });
});

describe("debug logging", () => {
  afterEach(() => {
    config.debug = undefined;
    vi.restoreAllMocks();
  });

  it("prints request bodies without keys or file contents", () => {
    config.debug = true;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.logRequest("OpenAI", "POST", "https://api.example.com/v1?key=AIza123", {
      prompt: `key ${keys[0]}`,
      image: `data:image/png;base64,${"B".repeat(500)}`
    });

    const printed = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(printed).toContain("?key=[REDACTED]");
    expect(printed).not.toContain(keys[0]);
    expect(printed).not.toContain("BBBB");
    expect(printed).toContain("key [REDACTED]");
  });
});

describe("provider errors", () => {
  it("mask keys in the message and body, and keep everything else", () => {
    const error = new RateLimitError(
      `Key ${keys[2]} is out of credits`,
      { error: { message: `Key ${keys[2]} is out of credits`, code: 402 } },
      "openrouter"
    );

    expect(error.message).toBe("Key [REDACTED] is out of credits");
    expect(error.body).toEqual({
      error: { message: "Key [REDACTED] is out of credits", code: 402 }
    });
    expect(error).toBeInstanceOf(APIError);
    expect(error.status).toBe(429);
  });
});
