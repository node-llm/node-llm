import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { withVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { MockProvider } from "../helpers/MockProvider.js";

describe("VCR Feature 5 & 6: DX Sugar & Auto-Naming", () => {
  let mock: MockProvider;

  beforeEach(() => {
    mock = new MockProvider();
    providerRegistry.register("mock-provider", () => mock);
  });

  afterEach(() => {
    providerRegistry.setInterceptor(undefined);
  });

  test(
    "Automatically names and records cassettes",
    withVCR(async () => {
      const llm = NodeLLM.withProvider("mock-provider");
      await llm.chat().ask("Sugar test");

      // The cassette name should be derived from the test title
      // "VCR Feature 5 & 6: DX Sugar & Auto-Naming > Automatically names and records cassettes"
      // Slugified: vcr-feature-5--6-dx-sugar--auto-naming-automatically-names-and-records-cassettes.json
    })
  );

  test("Verifying the file exists after withVCR", async () => {
    // Note: Since withVCR above runs, we check it here
    const files = fs.readdirSync(path.join(process.cwd(), ".llm-cassettes"));
    const found = files.some((f) => f.includes("automatically-names-and-records-cassettes"));
    expect(found).toBe(true);
  });

  test(
    "Allows explicit naming",
    withVCR("explicit-sugar-test", async () => {
      const llm = NodeLLM.withProvider("mock-provider");
      await llm.chat().ask("Explicit test");
    })
  );

  test("Verifying explicit file existence", async () => {
    const filePath = path.join(process.cwd(), ".llm-cassettes", "explicit-sugar-test.json");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
