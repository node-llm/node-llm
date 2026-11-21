import { describe, it, expect } from "vitest";
import { Scrubber } from "../../src/Scrubber.js";

describe("Scrubber key formats", () => {
  const scrubber = new Scrubber();

  it("masks keys with hyphens and other providers' formats", () => {
    for (const key of [
      "sk-ant-api03-abcdefghijklmnopqrstuvwxyz",
      "sk-proj-abcdefghijklmnopqrstuvwx",
      "sk-or-v1-0123456789abcdef0123456789",
      "xai-abcdefghijklmnopqrstuvwxyz",
      "AKIAABCDEFGHIJKLMNOP",
      "ghp_abcdefghijklmnopqrstuvwxyz0123456789"
    ])
      expect(scrubber.scrub(`token ${key} end`), key).toBe("token [REDACTED] end");
    expect(scrubber.scrub("token Bearer abcdefghijklmnopqrstuvwxyz end")).toBe(
      "token Bearer [REDACTED] end"
    );
  });

  it("masks key headers by name", () => {
    expect(
      scrubber.scrub({ "x-goog-api-key": "anything", "api-key": "a", "Proxy-Authorization": "b" })
    ).toEqual({
      "x-goog-api-key": "[REDACTED]",
      "api-key": "[REDACTED]",
      "Proxy-Authorization": "[REDACTED]"
    });
  });

  it("leaves ordinary text alone", () => {
    expect(scrubber.scrub("ask-me a question, task-list-item")).toBe(
      "ask-me a question, task-list-item"
    );
  });
});
