import { z } from "zod";

export interface SchemaDefinition {
  name: string;
  schema: z.ZodType<unknown> | Record<string, unknown>; // Support Zod or raw JSON Schema
  description?: string;
  strict?: boolean; // For OpenAI's strict mode
}

export class Schema {
  constructor(public readonly definition: SchemaDefinition) {}

  static fromZod(
    name: string,
    schema: z.ZodType<unknown>,
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
