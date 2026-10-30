import type { ZodSchema } from "./zod.js";

export interface SchemaDefinition {
  name: string;
  schema: ZodSchema | Record<string, unknown>; // A Zod 4 or Zod 3 schema, or raw JSON Schema
  description?: string;
  strict?: boolean; // For OpenAI's strict mode
}

export class Schema {
  constructor(public readonly definition: SchemaDefinition) {}

  static fromZod(
    name: string,
    schema: ZodSchema,
    options?: { description?: string; strict?: boolean }
  ): Schema {
    return new Schema({
      name,
      schema,
      description: options?.description,
      strict: options?.strict
    });
  }

  static fromJson(
    name: string,
    schema: Record<string, unknown>,
    options?: { description?: string; strict?: boolean }
  ): Schema {
    return new Schema({
      name,
      schema,
      description: options?.description,
      strict: options?.strict
    });
  }
}
