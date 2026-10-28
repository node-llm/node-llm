import { isZodSchema, zodToJson, ZodSchema } from "./zod.js";

export function toJsonSchema(schema: ZodSchema | Record<string, unknown>): Record<string, unknown> {
  // A Zod schema is converted; a JSON Schema object is used as it is.
  return isZodSchema(schema) ? zodToJson(schema) : schema;
}
