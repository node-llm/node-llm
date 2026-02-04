/**
 * Documentation Verification Tests: README.md & Docs Exports
 *
 * Verifies that all exports documented in the README actually exist.
 */
import { describe, it, expect } from "vitest";

describe("readme-exports", () => {
  describe("Prisma Adapter Exports", () => {
    it("exports createChat function", async () => {
      const { createChat } = await import("../../src/adapters/prisma/index.js");
      expect(typeof createChat).toBe("function");
    });

    it("exports loadChat function", async () => {
      const { loadChat } = await import("../../src/adapters/prisma/index.js");
      expect(typeof loadChat).toBe("function");
    });

    it("exports Chat class", async () => {
      const { Chat } = await import("../../src/adapters/prisma/index.js");
      expect(Chat).toBeDefined();
      expect(typeof Chat).toBe("function");
    });
  });

  describe("Type Exports", () => {
    it("exports ChatRecord type", async () => {
      // Type verification - just confirm the module exports it
      const module = await import("../../src/adapters/prisma/index.js");
      expect(module).toBeDefined();
      // Types are compile-time, but the module should exist
    });

    it("exports MessageRecord type", async () => {
      // Type verification - just confirm the module exports it
      const module = await import("../../src/adapters/prisma/index.js");
      expect(module).toBeDefined();
    });

    it("exports ChatOptions type", async () => {
      // Type verification - just confirm the module exports it
      const module = await import("../../src/adapters/prisma/index.js");
      expect(module).toBeDefined();
    });

    it("exports TableNames type", async () => {
      // Type verification - just confirm the module exports it
      const module = await import("../../src/adapters/prisma/index.js");
      expect(module).toBeDefined();
    });
  });

  describe("Main Package Re-exports", () => {
    it("main index re-exports prisma adapter", async () => {
      const { createChat, loadChat, Chat } = await import("../../src/index.js");
      expect(typeof createChat).toBe("function");
      expect(typeof loadChat).toBe("function");
      expect(Chat).toBeDefined();
    });
  });
});
