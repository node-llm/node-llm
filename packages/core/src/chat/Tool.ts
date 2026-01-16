import { z } from "zod";
import { toJsonSchema } from "../schema/to-json-schema.js";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
  handler?: (args: unknown) => Promise<string>;
}

/**
 * Anything that can be resolved into a ToolDefinition.
 */
export type ToolResolvable = Tool | { new (): Tool } | ToolDefinition;

/**
 * Subclass this to create tools with auto-generated schemas and type safety.
 */
export abstract class Tool<T = Record<string, unknown>> {
  /**
    * The name of the tool (must match [a-zA-Z0-9_-]+).
    */
  public abstract name: string;

  /**
    * A clear description of what the tool does, used by the LLM to decide when to call it.
    */
  public abstract description: string;

  /**
    * Parameters the tool accepts.
    * Can be a Zod object (for auto-schema + type safety) or a raw JSON Schema.
    */
  public abstract schema: z.ZodObject<z.ZodRawShape> | Record<string, unknown>;

  /**
   * The core logic for the tool.
   * 'args' will be parsed and validated based on 'schema'.
   */
  public abstract execute(args: T): Promise<unknown>;

  /**
   * Internal handler to bridge with LLM providers.
   * Converts any result to a string (usually JSON).
   */
  public async handler(args: T): Promise<string> {
    const result = await this.execute(args);
    if (result === undefined || result === null) return "";
    return typeof result === "string" ? result : JSON.stringify(result);
  }

  /**
   * Converts the tool definition and logic into a standard ToolDefinition interface.
   * This is called automatically by NodeLLM when registering tools.
   */
  public toLLMTool(): ToolDefinition {
    const rawSchema = toJsonSchema(this.schema);

    // We want the 'properties' and 'required' parts, not the full JSON Schema wrapper if present
    const parameters =
      (rawSchema as { type: string }).type === "object"
        ? rawSchema
        : {
            type: "object",
            properties: (rawSchema as { properties?: Record<string, unknown> }).properties || {},
            required: (rawSchema as { required?: string[] }).required || []
          };

    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: parameters as Record<string, unknown>
      },
      handler: (args: unknown) => this.handler(args as T)
    };
  }
}
