import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function toJsonSchema(schema: z.ZodType<any> | Record<string, any>): Record<string, any> {
  // If it's a Zod schema, convert it
  if (schema instanceof z.ZodType) {
    return zodToJsonSchema(schema, { target: "openApi3" });
  }
  // If it's already a JSON schema object, return as is
  return schema;
}
