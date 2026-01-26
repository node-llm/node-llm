import { test, expect, describe } from "vitest";
import { Serializer } from "../../src/Serializer.js";

describe("Serializer", () => {
  test("Handles Date objects", () => {
    const data = { date: new Date("2023-01-01T00:00:00.000Z") };
    const serialized = Serializer.serialize(data);
    const deserialized = Serializer.deserialize(serialized);
    expect(deserialized).toEqual(data);
    expect((deserialized as any).date).toBeInstanceOf(Date);
  });

  test("Handles Map objects", () => {
    const data = {
      map: new Map<string, string | number>([
        ["key", "value"],
        ["num", 123]
      ])
    };
    const serialized = Serializer.serialize(data);
    const deserialized = Serializer.deserialize(serialized);
    expect(deserialized).toEqual(data);
    expect((deserialized as any).map).toBeInstanceOf(Map);
    expect((deserialized as any).map.get("key")).toBe("value");
  });

  test("Handles Set objects", () => {
    const data = { set: new Set([1, 2, 3, "four"]) };
    const serialized = Serializer.serialize(data);
    const deserialized = Serializer.deserialize(serialized);
    expect(deserialized).toEqual(data);
    expect((deserialized as any).set).toBeInstanceOf(Set);
    expect((deserialized as any).set.has("four")).toBe(true);
  });

  test("Handles RegExp objects", () => {
    const data = { regex: /abc/gi };
    const serialized = Serializer.serialize(data);
    const deserialized = Serializer.deserialize(serialized);
    expect(deserialized).toEqual(data);
    expect((deserialized as any).regex).toBeInstanceOf(RegExp);
    expect((deserialized as any).regex.flags).toContain("g");
    expect((deserialized as any).regex.flags).toContain("i");
  });

  test("Handles Error objects", () => {
    const err = new Error("Test error");
    err.name = "CustomError";
    (err as any).customProp = "customValue";

    const data = { error: err };
    const serialized = Serializer.serialize(data);
    const deserialized: any = Serializer.deserialize(serialized);

    expect(deserialized.error).toBeInstanceOf(Error);
    expect(deserialized.error.message).toBe("Test error");
    expect(deserialized.error.name).toBe("CustomError");
    expect(deserialized.error.customProp).toBe("customValue");
    expect(deserialized.error.stack).toBeDefined();
  });

  test("Handles Buffer objects", () => {
    if (typeof Buffer === "undefined") return; // Skip in browser-like envs if any
    const data = { buf: Buffer.from("Hello World") };
    const serialized = Serializer.serialize(data);
    const deserialized: any = Serializer.deserialize(serialized);

    expect(deserialized.buf).toBeInstanceOf(Buffer);
    expect(deserialized.buf.toString()).toBe("Hello World");
  });

  test("Handles Infinity and NaN", () => {
    const data = { inf: Infinity, negInf: -Infinity, nan: NaN };
    const serialized = Serializer.serialize(data);
    const deserialized: any = Serializer.deserialize(serialized);

    expect(deserialized.inf).toBe(Infinity);
    expect(deserialized.negInf).toBe(-Infinity);
    expect(Number.isNaN(deserialized.nan)).toBe(true);
  });
});
