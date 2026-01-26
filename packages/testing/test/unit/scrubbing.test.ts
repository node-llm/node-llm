import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR Feature 4: Automatic Scrubbing", () => {
  const CASSETTE_NAME = "scrub-test";
  // Use temp directory for scrubbing tests to avoid re-recording committed cassettes
  let CASSETTE_DIR: string;
  let CASSETTE_PATH: string;
  let mock: MockProvider;

  beforeEach(() => {
    CASSETTE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "vcr-scrub-test-"));
    CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
    mock = new MockProvider();
    providerRegistry.register("mock-provider", () => mock as any);
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
    // Clean up temp directory
    if (fs.existsSync(CASSETTE_DIR)) {
      fs.rmSync(CASSETTE_DIR, { recursive: true, force: true });
    }
  });

  test("Automatically scrubs API keys and sensitive JSON keys", async () => {
    const vcr = setupVCR(CASSETTE_NAME, {
      mode: "record",
      cassettesDir: CASSETTE_DIR,
      _allowRecordingInCI: true
    });
    const llm = NodeLLM.withProvider("mock-provider");

    // 1. Trigger request with secrets
    await llm.chat().ask("My key is sk-abcdef1234567890abcdef1234567890");

    await vcr.stop();

    // 2. Read back from disk and verify redaction
    const raw = fs.readFileSync(CASSETTE_PATH, "utf-8");
    expect(raw).not.toContain("sk-abcdef");
    expect(raw).toContain("[REDACTED]");

    // 3. Verify that we DID NOT redact token counts (because they are numbers)
    expect(raw).toContain('"total_tokens": 20');
  });

  test("Allows custom scrubbing hooks", async () => {
    const vcr = setupVCR(CASSETTE_NAME, {
      mode: "record",
      cassettesDir: CASSETTE_DIR,
      _allowRecordingInCI: true,
      scrub: (data: unknown) => {
        // Deep string replacement on the whole interaction object
        return JSON.parse(JSON.stringify(data).replace(/sensitive-info/g, "XXXX"));
      }
    });

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("This contains sensitive-info");
    await vcr.stop();

    const raw = fs.readFileSync(CASSETTE_PATH, "utf-8");
    expect(raw).toContain("XXXX");
    expect(raw).not.toContain("sensitive-info");
  });

  test("Supports declarative custom keys and patterns via config", async () => {
    const vcr = setupVCR("custom-scrub-config", {
      mode: "record",
      cassettesDir: CASSETTE_DIR,
      _allowRecordingInCI: true,
      sensitiveKeys: ["user_email", "internal_id"],
      sensitivePatterns: [/secret-project-[a-z]+/g]
    });

    const llm = NodeLLM.withProvider("mock-provider");
    await llm.chat().ask("status of secret-project-omega");

    await vcr.stop();

    const cassettePath = path.join(CASSETTE_DIR, "custom-scrub-config.json");
    const raw = fs.readFileSync(cassettePath, "utf-8");

    // Verify Pattern Scrubbing
    expect(raw).not.toContain("secret-project-omega");
    expect(raw).toContain("[REDACTED]");
  });

  test("Retains default scrubbing when custom config is provided", async () => {
    const vcr = setupVCR("defaults-plus-custom", {
      mode: "record",
      cassettesDir: CASSETTE_DIR,
      _allowRecordingInCI: true,
      sensitiveKeys: ["custom_field"]
    });

    const llm = NodeLLM.withProvider("mock-provider");

    // We send a standard fake key (matches default pattern) AND a custom field
    await llm.chat().ask("key sk-123456789012345678901234567890 plus custom_field");

    await vcr.stop();

    const path = `${CASSETTE_DIR}/defaults-plus-custom.json`;
    const raw = fs.readFileSync(path, "utf-8");

    // Default pattern should still work
    expect(raw).not.toContain("sk-1234567890");
    expect(raw).toContain("[REDACTED]");
  });
});
