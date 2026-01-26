import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { setupVCR } from "../../src/vcr.js";
import fs from "node:fs";
import path from "node:path";

describe("VCR Feature 8: CI-Safe Replay", () => {
  const CASSETTE_NAME = "ci-test-cassette";
  const CASSETTE_DIR = path.join(__dirname, "../cassettes");
  const CASSETTE_PATH = path.join(CASSETTE_DIR, `${CASSETTE_NAME}.json`);
  const originalCI = process.env.CI;

  beforeEach(() => {
    if (fs.existsSync(CASSETTE_PATH)) fs.unlinkSync(CASSETTE_PATH);
  });

  afterEach(() => {
    process.env.CI = originalCI;
  });

  test("Throws error if cassette is missing in CI", () => {
    process.env.CI = "true";

    // Using auto mode when file doesn't exist should throw in CI
    expect(() => setupVCR(CASSETTE_NAME, { mode: "auto", cassettesDir: CASSETTE_DIR })).toThrow(
      /Cassette missing in CI/
    );
  });

  test("Throws error if record mode is explicitly set in CI", () => {
    process.env.CI = "true";

    expect(() => setupVCR(CASSETTE_NAME, { mode: "record", cassettesDir: CASSETTE_DIR })).toThrow(
      /Recording cassettes is not allowed in CI/
    );
  });
});
