import { test, expect, describe, afterEach } from "vitest";
import { withVCR, describeVCR } from "../../src/vcr.js";
import { NodeLLM, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";
import fs from "node:fs";
import path from "node:path";
import { Serializer } from "../../src/Serializer.js";

describe("VCR Advanced Types Persistence", () => {
  const cassettePath = "test/cassettes/vcr-advanced-types-persistence/handles-rich-types.json";

  afterEach(() => {
    if (fs.existsSync(cassettePath)) {
      // Clean up file
      fs.rmSync(cassettePath);
      // Try to clean up parent dir if empty (optional but good)
      try {
        fs.rmdirSync(path.dirname(cassettePath));
      } catch {
        /* ignore */
      }
    }
  });

  test("Persists Date and Map in cassettes", async () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const map = new Map<string, string>([["key", "value"]]);

    await describeVCR("VCR Advanced Types Persistence", async () => {
      providerRegistry.register("mock-provider", () => new MockProvider() as any);

      // 1. Record Phase
      await withVCR(
        "Handles Rich Types",
        { mode: "record", _allowRecordingInCI: true },
        async () => {
          const llm = NodeLLM.withProvider("mock-provider");

          // Pass rich types in params
          await llm
            .chat()
            .withParams({
              createdAt: date,
              meta: map
            })
            .ask("Hello");
        }
      )();
    });

    // 2. Verify Disk Content (Serialization)
    expect(fs.existsSync(cassettePath)).toBe(true);
    const rawContent = fs.readFileSync(cassettePath, "utf-8");

    // Should NOT contain raw ISO string only, but the typed wrapper
    expect(rawContent).toContain('"$type": "Date"');
    expect(rawContent).toContain('"value": "2024-01-01T00:00:00.000Z"');
    expect(rawContent).toContain('"$type": "Map"');

    // 3. Replay/Load Phase (Deserialization)
    // We manually load to verify the deserialization logic
    const cassette = Serializer.deserialize<any>(rawContent);
    const request = cassette.interactions[0].request;

    // Check that params are restored as real instances
    expect(request.createdAt).toBeInstanceOf(Date);
    expect(request.createdAt.toISOString()).toBe(date.toISOString());

    expect(request.meta).toBeInstanceOf(Map);
    expect(request.meta.get("key")).toBe("value");
  });
});
