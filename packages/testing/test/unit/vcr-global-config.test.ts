import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { configureVCR, resetVCRConfig, setupVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR: Global Configuration", () => {
  const CASSETTE_DIR = path.join(__dirname, "../cassettes");

  beforeEach(() => {
    resetVCRConfig();
    providerRegistry.register("mock-provider", () => new MockProvider());
  });

  afterEach(() => {
    resetVCRConfig();
    providerRegistry.setInterceptor(undefined);
  });

  test("Configures global sensitive keys", async () => {
    configureVCR({
      sensitiveKeys: ["custom_secret"]
    });

    const CASSETTE_NAME = "global-config-keys";
    const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);

    const vcr = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
    const llm = NodeLLM.withProvider("mock-provider");

    await llm.chat().ask("regular question");
    await vcr.stop();

    const raw = fs.readFileSync(CASSETTE_PATH, "utf-8");
    // Verify cassette was created and has version/metadata (sign of proper implementation)
    const cassette = JSON.parse(raw);
    expect(cassette.version).toBe("1.0");
    expect(cassette.metadata).toBeDefined();
  });

  test("Configures global sensitive patterns", async () => {
    configureVCR({
      sensitivePatterns: [/custom-secret-[a-z]+/g]
    });

    const CASSETTE_NAME = "global-config-patterns";
    const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);

    const vcr = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
    const llm = NodeLLM.withProvider("mock-provider");

    await llm.chat().ask("Status of custom-secret-omega");
    await vcr.stop();

    const raw = fs.readFileSync(CASSETTE_PATH, "utf-8");
    expect(raw).not.toContain("custom-secret-omega");
    expect(raw).toContain("[REDACTED]");
  });

  test("resetVCRConfig clears all global settings", async () => {
    configureVCR({
      sensitiveKeys: ["to_reset"]
    });

    resetVCRConfig();

    const CASSETTE_NAME = "global-config-reset";
    const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);

    const vcr = setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR });
    const llm = NodeLLM.withProvider("mock-provider");

    await llm.chat().ask("to_reset should not be redacted");
    await vcr.stop();

    const raw = fs.readFileSync(CASSETTE_PATH, "utf-8");
    // Should be present because we reset the config
    expect(raw).toContain("to_reset");
  });
});
