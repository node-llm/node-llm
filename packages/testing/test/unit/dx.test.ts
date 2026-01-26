import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { withVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR Feature 5 & 6: DX Sugar & Auto-Naming", () => {
  let mock: MockProvider;
  const CASSETTE_DIR = path.join(__dirname, "../cassettes");

  beforeEach(() => {
    mock = new MockProvider();
    providerRegistry.register("mock-provider", () => mock);
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test(
    "Automatically names and records cassettes",
    withVCR({ cassettesDir: CASSETTE_DIR }, async () => {
      const llm = NodeLLM.withProvider("mock-provider");
      await llm.chat().ask("Sugar test");

      // The cassette name should be derived from the test title
    })
  );

  test("Verifying the file exists after withVCR", async () => {
    // Note: Since withVCR above runs, we check it here
    const files = fs.readdirSync(CASSETTE_DIR);
    const found = files.some((f) => f.includes("automatically-names-and-records-cassettes"));
    expect(found).toBe(true);
  });

  test(
    "Allows explicit naming",
    withVCR("explicit-sugar-test", { cassettesDir: CASSETTE_DIR }, async () => {
      const llm = NodeLLM.withProvider("mock-provider");
      await llm.chat().ask("Explicit test");
    })
  );

  test("Verifying explicit file existence", async () => {
    const filePath = path.join(CASSETTE_DIR, "explicit-sugar-test.json");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
