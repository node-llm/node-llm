/**
 * Documentation Verification Tests: README.md Exports
 *
 * Verifies that all exports documented in the README actually exist.
 */
import { describe, it, expect } from "vitest";

describe("readme-exports", () => {
  describe("Main Package Exports", () => {
    it("exports withVCR function", async () => {
      const { withVCR } = await import("../../src/index.js");
      expect(typeof withVCR).toBe("function");
    });

    it("exports describeVCR function", async () => {
      const { describeVCR } = await import("../../src/index.js");
      expect(typeof describeVCR).toBe("function");
    });

    it("exports setupVCR function", async () => {
      const { setupVCR } = await import("../../src/index.js");
      expect(typeof setupVCR).toBe("function");
    });

    it("exports mockLLM function", async () => {
      const { mockLLM } = await import("../../src/index.js");
      expect(typeof mockLLM).toBe("function");
    });

    it("exports configureVCR function", async () => {
      const { configureVCR } = await import("../../src/index.js");
      expect(typeof configureVCR).toBe("function");
    });

    it("exports resetVCRConfig function", async () => {
      const { resetVCRConfig } = await import("../../src/index.js");
      expect(typeof resetVCRConfig).toBe("function");
    });
  });

  describe("Class Exports", () => {
    it("exports VCR class", async () => {
      const { VCR } = await import("../../src/index.js");
      expect(VCR).toBeDefined();
      expect(typeof VCR).toBe("function");
    });

    it("exports Mocker class", async () => {
      const { Mocker } = await import("../../src/index.js");
      expect(Mocker).toBeDefined();
      expect(typeof Mocker).toBe("function");
    });
  });
});
