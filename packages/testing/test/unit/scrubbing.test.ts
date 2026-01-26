import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR Feature 4: Automatic Scrubbing", () => {
  const CASSETTE_NAME = "scrub-test";
  const CASSETTE_DIR = path.join(__dirname, "../cassettes");
  const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
  let mock: MockProvider;

  beforeEach(() => {
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);
    mock = new MockProvider();
    providerRegistry.register("mock-provider", () => mock);
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test("Automatically scrubs API keys and sensitive JSON keys", async () => {
    const vcr = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
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
});
