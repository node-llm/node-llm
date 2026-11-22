import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "../../../src/utils/logger.js";

describe("logger.error", () => {
  afterEach(() => vi.restoreAllMocks());

  it("masks keys and passwords in the error it prints", () => {
    const printed = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error(
      "Tool execution failed:",
      new Error("connect postgres://app:hunter2@db failed with sk-proj-abcdefghijklmnopqrstuv")
    );
    const text = printed.mock.calls.flat().join(" ");
    expect(text).toContain("postgres://app:[REDACTED]@db");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("sk-proj-abcdefghijklmnopqrstuv");
  });
});
