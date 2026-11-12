import { z } from "zod/v3";
import { isZodSchema, Zod3Schema, Zod4Schema, ZodSchema } from "../schema/zod.js";
import { toJsonSchema } from "../schema/to-json-schema.js";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
  /** Gemini's signature for its reasoning behind the call, which it requires back with the call */
  thought_signature?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorClass<E extends Error = Error> = abstract new (...args: any[]) => E;

/**
 * Turns an error a tool raised into the result the model sees.
 * Return a string, an object (sent as JSON) or a ToolHalt.
 */
export type ToolRescueHandler<E extends Error = Error, T = Record<string, unknown>> = (
  error: E,
  args: T
) => unknown;

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    strict?: boolean;
    parameters: Record<string, unknown>;
  };
  /**
   * Leave this tool's definition out of requests until the model finds it with
   * the built-in `tool_search` tool. For chats with many tools.
   */
  defer?: boolean;
  // Arguments are parsed from the model's JSON; `any` lets a handler declare
  // their shape, which `unknown` rejected.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler?: (args: any) => Promise<string | ToolHalt>;
}

/**
 * Stops the agentic tool execution loop and returns the content as the final response.
 * Return this from a tool's execute() method to immediately end the conversation turn.
 *
 * @example
 * ```typescript
 * class PaymentTool extends Tool<{ amount: number }> {
 *   async execute({ amount }: { amount: number }) {
 *     if (amount > 10000) {
 *       return this.halt("Payment requires manager approval. Please contact support.");
 *     }
 *     return processPayment(amount);
 *   }
 * }
 * ```
 */
export class ToolHalt {
  constructor(public readonly content: string) {}

  toString(): string {
    return this.content;
  }

  toJSON(): { halt: true; content: string } {
    return { halt: true, content: this.content };
  }
}

/**
 * Anything that can be resolved into a ToolDefinition.
 */
export type ToolResolvable = Tool | { new (): Tool } | ToolDefinition;

/**
 * Subclass this to create tools with auto-generated schemas and type safety.
 *
 * Pass the argument type for a fully typed `execute`:
 *
 * ```typescript
 * const schema = z.object({ location: z.string() });
 *
 * class WeatherTool extends Tool<z.infer<typeof schema>> {
 *   name = "get_weather";
 *   description = "Get the current weather for a location";
 *   schema = schema;
 *
 *   async execute({ location }: z.infer<typeof schema>) {
 *     return `Sunny in ${location}`;
 *   }
 * }
 * ```
 *
 * Without it, the arguments default to `Record<string, any>`, so a subclass can
 * declare `execute` with its own argument shape. (With `Record<string, unknown>`
 * an `execute({ location })` override was not assignable to the base method,
 * and the class was then rejected by `withTool`.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the note above
export abstract class Tool<T = Record<string, any>> {
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
   * Can be a Zod 4 or Zod 3 object (for auto-schema + type safety) or a raw JSON Schema.
   */
  public abstract schema:
    | Zod4Schema
    | Zod3Schema
    | z.ZodObject<z.ZodRawShape>
    | Record<string, unknown>;

  /**
   * Whether to enforce strict JSON schema constraints for OpenAI and similar providers.
   * When true, additionalProperties: false and full required arrays are automatically applied.
   */
  public strict?: boolean;

  /**
   * Leave this tool out of requests until the model finds it with the built-in
   * `tool_search` tool. Use it when a chat has more tools than a model should
   * see at once.
   */
  public defer?: boolean;

  /**
   * The core logic for the tool.
   * 'args' will be parsed and validated based on 'schema'.
   */
  public abstract execute(args: T): Promise<unknown>;

  private readonly rescueHandlers: Array<[ErrorClass, ToolRescueHandler<Error, T>]> = [];

  /**
   * Turn an error of `errorClass` (or a subclass) thrown by `execute` into the
   * result the model sees. Call it in the constructor. When several handlers
   * match, the one registered last wins. Errors no handler matches keep the
   * default "Error executing tool" result.
   *
   * @example
   * ```typescript
   * class OrderStatusTool extends Tool<{ id: string }> {
   *   constructor() {
   *     super();
   *     this.rescueFrom(NotFoundError, (_error, { id }) => ({ error: `No order ${id}` }));
   *   }
   * }
   * ```
   */
  protected rescueFrom<E extends Error>(
    errorClass: ErrorClass<E>,
    handler: ToolRescueHandler<E, T>
  ): this {
    this.rescueHandlers.push([errorClass, handler as ToolRescueHandler<Error, T>]);
    return this;
  }

  private async rescue(error: unknown, args: T): Promise<{ result: unknown } | undefined> {
    for (let i = this.rescueHandlers.length - 1; i >= 0; i--) {
      const [errorClass, handler] = this.rescueHandlers[i]!;
      if (error instanceof errorClass) return { result: await handler(error, args) };
    }
    return undefined;
  }

  /**
   * Stop the agentic loop and return this message as the final tool result.
   * Use this when you want to end the conversation turn immediately.
   *
   * @example
   * ```typescript
   * async execute({ amount }: { amount: number }) {
   *   if (amount > 10000) {
   *     return this.halt("Payment requires manager approval.");
   *   }
   *   return processPayment(amount);
   * }
   * ```
   */
  protected halt(message: string): ToolHalt {
    return new ToolHalt(message);
  }

  /**
   * Internal handler to bridge with LLM providers.
   * Converts any result to a string (usually JSON).
   * Preserves ToolHalt instances for the execution loop to detect.
   */
  public async handler(args: T): Promise<string | ToolHalt> {
    try {
      // 1. Runtime validation if Zod schema is provided
      let validatedArgs = args;
      if (isZodSchema(this.schema)) {
        try {
          validatedArgs = this.schema.parse(args) as T;
        } catch (validationError: any) {
          return `Invalid tool arguments: ${validationError.message || validationError}`;
        }
      }

      let result: unknown;
      try {
        result = await this.execute(validatedArgs);
      } catch (error) {
        const rescued = await this.rescue(error, validatedArgs);
        if (!rescued) throw error;
        result = rescued.result;
      }

      // Preserve ToolHalt for the execution loop to handle
      if (result instanceof ToolHalt) {
        return result;
      }

      if (result === undefined || result === null) return "";
      return typeof result === "string" ? result : JSON.stringify(result);
    } catch (error: any) {
      // A fatal error (ToolError with fatal: true, or a 401/403) must reach the agent loop, which
      // stops and throws it. Turned into text here, it would only be shown to the model.
      if (isFatal(error)) throw error;
      return `Error executing tool '${this.name}': ${error.message || error}`;
    }
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
        strict: this.strict,
        parameters: parameters as Record<string, unknown>
      },
      ...(this.defer ? { defer: true } : {}),
      handler: (args: unknown) => this.handler(args as T)
    };
  }
}

/**
 * Defines a tool without a class, mirroring `defineAgent`. `execute` receives arguments typed
 * from the Zod schema; return `new ToolHalt(message)` from it to end the turn.
 *
 * @example
 * ```typescript
 * const WeatherTool = defineTool({
 *   name: "get_weather",
 *   description: "Get the current weather for a location",
 *   schema: z.object({ location: z.string() }),
 *   execute: async ({ location }) => `Sunny in ${location}`
 * });
 * chat.withTool(WeatherTool);
 * ```
 */
export function defineTool<Args extends Record<string, unknown>>(definition: {
  name: string;
  description: string;
  schema: ZodSchema<Args>;
  strict?: boolean;
  /** See `Tool.defer`. */
  defer?: boolean;
  execute: (args: Args) => unknown;
  /** Error handlers, as `[ErrorClass, handler]` pairs; see `Tool.rescueFrom`. */
  rescueFrom?: Array<[ErrorClass, ToolRescueHandler<Error, Args>]>;
}): new () => Tool<Args> {
  return class extends Tool<Args> {
    name = definition.name;
    description = definition.description;
    schema = definition.schema;
    strict = definition.strict;
    defer = definition.defer;

    constructor() {
      super();
      for (const [errorClass, handler] of definition.rescueFrom ?? []) {
        this.rescueFrom(errorClass, handler);
      }
    }

    async execute(args: Args) {
      return definition.execute(args);
    }
  };
}

/** An error the agent loop stops on instead of showing it to the model. */
const isFatal = (error: unknown): boolean => {
  const { fatal, status } = (error ?? {}) as { fatal?: boolean; status?: number };
  return fatal === true || status === 401 || status === 403;
};
