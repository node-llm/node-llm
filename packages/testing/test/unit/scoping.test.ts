import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { withVCR, describeVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";
import fs from "node:fs";
import path from "node:path";

describe("VCR Feature 12: Hierarchical Scoping", () => {
  // Use absolute path relative to this test file
  const CUSTOM_DIR = path.join(__dirname, "../cassettes/custom-scope-test");
  const LEVEL_1 = "Authentication";
  const LEVEL_2 = "Login Flow";
  const TEST_NAME = "Successful Login";

  beforeEach(() => {
    if (fs.existsSync(CUSTOM_DIR)) fs.rmSync(CUSTOM_DIR, { recursive: true, force: true });
    providerRegistry.register("mock-provider", () => new MockProvider());
  });

  test("Organizes cassettes into nested subfolders", async () => {
    // We use process.env to set the base dir for this test
    process.env.VCR_CASSETTE_DIR = CUSTOM_DIR;

    await describeVCR(LEVEL_1, () => {
      return describeVCR(LEVEL_2, async () => {
        const testFn = withVCR(TEST_NAME, async () => {
          const llm = NodeLLM.withProvider("mock-provider");
          await llm.chat().ask("Trigger record");
        });

        await testFn();
      });
    });

    // Verify the path exists
    const expectedPath = path.join(
      CUSTOM_DIR,
      "authentication",
      "login-flow",
      "successful-login.json"
    );

    expect(fs.existsSync(expectedPath)).toBe(true);

    // Clean up env
    delete process.env.VCR_CASSETTE_DIR;
  });
});
