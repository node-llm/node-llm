import { describe, it, expect } from "vitest";
import { redactForLog, redactSecrets } from "../../../src/utils/redact.js";

const timed = (fn: () => unknown) => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};

describe("redaction stays fast on hostile input", () => {
  it("doesn't backtrack on long runs", () => {
    for (const input of [
      "a.".repeat(40_000),
      "a".repeat(80_000),
      "http://".repeat(10_000),
      "x://u:".repeat(10_000),
      "-----BEGIN RSA PRIVATE KEY-----".repeat(2_000),
      "eyJ" + "a".repeat(80_000),
      "Bearer " + "a".repeat(80_000),
      "password=" + "a".repeat(80_000)
    ])
      expect(
        timed(() => redactSecrets(input)),
        input.slice(0, 20)
      ).toBeLessThan(250);
  });
});

describe("URL passwords", () => {
  it("are masked without crossing JSON fields", () => {
    expect(redactSecrets('{"a":"http://h:1","b":["x@y"]}')).toBe('{"a":"http://h:1","b":["x@y"]}');
    expect(redactSecrets("redis://:hunter2@cache:6379")).toBe("redis://:[REDACTED]@cache:6379");
    expect(redactSecrets("postgres://user:p@ss@db/app")).toBe("postgres://user:[REDACTED]@db/app");
    expect(redactSecrets("https://example.com:8080/a@b")).toBe("https://example.com:8080/a@b");
  });
});

describe("key formats", () => {
  it("masks more providers and forms", () => {
    for (const secret of [
      "ASIAABCDEFGHIJKLMNOP",
      "github_pat_11ABCDEFG0123456789_abcdefghij",
      "sk_live_abcdefghijklmnop1234",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop",
      "xoxb-123456789012-abcdefghij"
    ])
      expect(redactSecrets(`x ${secret} y`), secret).toBe("x [REDACTED] y");
    expect(redactSecrets("OPENAI_KEY_sk-proj-abcdefghijklmnopqrstuv")).toBe(
      "OPENAI_KEY_[REDACTED]"
    );
    expect(redactSecrets("Authorization: Basic dXNlcjpwYXNzd29yZDEyMzQ=")).toBe(
      "Authorization: Basic [REDACTED]"
    );
    expect(redactSecrets("aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")).toBe(
      "aws_secret_access_key = [REDACTED]"
    );
    expect(redactSecrets("-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----")).toBe(
      "[REDACTED PRIVATE KEY]"
    );
  });

  it("leaves ordinary words alone", () => {
    expect(redactSecrets("ask-user-for-confirmation_step and task-list")).toBe(
      "ask-user-for-confirmation_step and task-list"
    );
  });
});

describe("secret fields and base64", () => {
  it("masks the library's own key names and any long base64 field", () => {
    expect(
      redactForLog({
        openaiApiKey: "a",
        secretAccessKey: "b",
        accessKeyId: "c",
        token: "d",
        private_key: "e",
        max_tokens: 100,
        b64_json: "A".repeat(300),
        bytesBase64Encoded: "B".repeat(300),
        prompt: "hello"
      })
    ).toEqual({
      openaiApiKey: "[REDACTED]",
      secretAccessKey: "[REDACTED]",
      accessKeyId: "[REDACTED]",
      token: "[REDACTED]",
      private_key: "[REDACTED]",
      max_tokens: 100,
      b64_json: "[300 chars of base64]",
      bytesBase64Encoded: "[300 chars of base64]",
      prompt: "hello"
    });
  });
});
