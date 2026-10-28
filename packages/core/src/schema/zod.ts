import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * A Zod 4 schema. Typed by shape, because Zod's own types only match schemas from the same Zod
 * version, and NodeLLM takes schemas from whichever Zod 4 release the app installs.
 */
export interface Zod4Schema<Output = unknown> {
  readonly _zod: { readonly output: Output };
  parse(value: unknown): Output;
}

/**
 * A Zod 3 schema, typed by shape like Zod 4's so a schema from another copy of Zod 3 matches.
 * Supported until NodeLLM 2.0, which drops Zod 3; use Zod 4 schemas.
 */
export interface Zod3Schema<Output = unknown> {
  readonly _def: unknown;
  readonly _output: Output;
  parse(value: unknown): Output;
}

/** A Zod 4 or Zod 3 schema. */
export type ZodSchema<Output = unknown> = Zod4Schema<Output> | Zod3Schema<Output>;

/**
 * Whether a value is a Zod 4 or Zod 3 schema. Checked by shape rather than with `instanceof`,
 * which fails for Zod 4 schemas and for schemas from another copy of Zod 3.
 */
export function isZodSchema(value: unknown): value is ZodSchema {
  if (typeof value !== "object" || value === null) return false;
  if (typeof (value as { parse?: unknown }).parse !== "function") return false;
  return "_zod" in value || "_def" in value;
}

/**
 * The JSON Schema a model is given for a Zod schema: the shape it must send, so fields with
 * defaults are optional.
 */
export function zodToJson(schema: ZodSchema): Record<string, unknown> {
  return "_zod" in schema ? zod4ToJson(schema) : zod3ToJson(schema);
}

type Zod4ToJsonSchema = (params: { target: "openapi-3.0"; io: "input" }) => Record<string, unknown>;

// Zod 4.2 added toJSONSchema() to schemas; earlier Zod 4 releases and zod/mini don't have it.
function zod4ToJson(schema: Zod4Schema): Record<string, unknown> {
  const toJSONSchema = (schema as { toJSONSchema?: Zod4ToJsonSchema }).toJSONSchema;
  if (typeof toJSONSchema !== "function") {
    throw new Error(
      `[NodeLLM] Zod 4 schemas need Zod 4.2 or later, imported from "zod" rather than "zod/mini".`
    );
  }
  return toJSONSchema.call(schema, { target: "openapi-3.0", io: "input" });
}

// Removed with Zod 3 support in NodeLLM 2.0.
function zod3ToJson(schema: Zod3Schema): Record<string, unknown> {
  return zodToJsonSchema(schema as unknown as ZodTypeAny, { target: "openApi3" });
}
