/**
 * Handles serialization and deserialization of complex types that JSON.stringify/parse
 * natively lose (Date, Map, Set, RegExp, Error, Infinity, NaN, Buffer).
 */
export class Serializer {
  public static serialize(data: unknown, space?: string | number): string {
    return JSON.stringify(data, Serializer.replacer, space);
  }

  public static deserialize<T = unknown>(json: string): T {
    return JSON.parse(json, Serializer.reviver);
  }

  /**
   * Deep clone that preserves types better than JSON.parse(JSON.stringify(x))
   * Uses structuredClone if available (Node 17+), otherwise falls back to serialization.
   */
  public static clone<T>(data: T): T {
    if (typeof globalThis.structuredClone === "function") {
      try {
        return globalThis.structuredClone(data);
      } catch (err) {
        // Fallback for types structuredClone might not handle or implementation quirks
      }
    }
    return Serializer.deserialize(Serializer.serialize(data));
  }

  private static replacer(this: any, key: string, value: unknown): unknown {
    const originalValue = this[key];

    if (originalValue === Infinity) return { $type: "Infinity" };
    if (originalValue === -Infinity) return { $type: "-Infinity" };
    if (Number.isNaN(originalValue)) return { $type: "NaN" };

    if (originalValue instanceof Date) {
      return { $type: "Date", value: originalValue.toISOString() };
    }

    if (originalValue instanceof RegExp) {
      return { $type: "RegExp", source: originalValue.source, flags: originalValue.flags };
    }

    if (originalValue instanceof Map) {
      return { $type: "Map", value: Array.from(originalValue.entries()) };
    }

    if (originalValue instanceof Set) {
      return { $type: "Set", value: Array.from(originalValue.values()) };
    }

    if (originalValue instanceof Error) {
      return {
        ...originalValue, // Capture literal properties attached to the error
        $type: "Error",
        name: originalValue.name,
        message: originalValue.message,
        stack: originalValue.stack,
        cause: (originalValue as any).cause
      };
    }

    // Handle Buffers (Node.js)
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(originalValue)) {
      return { $type: "Buffer", value: originalValue.toString("base64") };
    }

    return value;
  }

  private static reviver(key: string, value: unknown): unknown {
    if (value && typeof value === "object" && "$type" in value) {
      const typedValue = value as { $type: string; value?: any; [key: string]: any };

      switch (typedValue.$type) {
        case "Date":
          return new Date(typedValue.value);
        case "RegExp":
          return new RegExp(typedValue.source, typedValue.flags);
        case "Map":
          return new Map(typedValue.value);
        case "Set":
          return new Set(typedValue.value);
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        case "NaN":
          return NaN;
        case "Error": {
          const err = new Error(typedValue.message);
          err.name = typedValue.name;
          if (typedValue.stack) err.stack = typedValue.stack;
          if (typedValue.cause) (err as any).cause = typedValue.cause;
          // Restore other properties
          for (const k in typedValue) {
            if (["$type", "name", "message", "stack", "cause"].includes(k)) continue;
            (err as any)[k] = typedValue[k];
          }
          return err;
        }
        case "Buffer":
          if (typeof Buffer !== "undefined") {
            return Buffer.from(typedValue.value, "base64");
          }
          return typedValue.value;
        default:
          return value;
      }
    }
    return value;
  }
}
