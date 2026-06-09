import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveModelAlias } from "../../../src/model_aliases.js";
import { logger } from "../../../src/utils/logger.js";
import { config } from "../../../src/config.js";

describe("Model Alias Resolution Logging", () => {
  const originalDebug = config.debug;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    config.debug = true;
    debugSpy = vi.spyOn(logger, "debug");
  });

  afterEach(() => {
    config.debug = originalDebug;
    debugSpy.mockRestore();
  });

  it("should log when alias is resolved", () => {
    const result = resolveModelAlias("claude-3-5-haiku", "anthropic");

    expect(result).toBe("claude-3-5-haiku-20241022");
    expect(debugSpy).toHaveBeenCalledWith(
      "Resolved model alias 'claude-3-5-haiku' → 'claude-3-5-haiku-20241022' for provider 'anthropic'"
    );
  });

  it("should log when no alias mapping found", () => {
    const result = resolveModelAlias("custom-model-123", "anthropic");

    expect(result).toBe("custom-model-123");
    expect(debugSpy).toHaveBeenCalledWith(
      "No alias mapping found for 'custom-model-123' with provider 'anthropic', using as-is"
    );
  });

  it("should not log when provider is not specified", () => {
    const result = resolveModelAlias("gpt-4o");

    expect(result).toBe("gpt-4o");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("should log when alias exists but not for provider", () => {
    const result = resolveModelAlias("gpt-4o", "anthropic");

    expect(result).toBe("gpt-4o");
    expect(debugSpy).toHaveBeenCalledWith(
      "No alias mapping found for 'gpt-4o' with provider 'anthropic', using as-is"
    );
  });
});
