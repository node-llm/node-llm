import { Usage, ThinkingResult } from "../providers/Provider.js";
import { ToolCall } from "./Tool.js";
import { Schema } from "../schema/Schema.js";
import { extractJson } from "../utils/json.js";
import { z } from "zod";

/**
 * Enhanced string that includes token usage metadata.
 * Behaves like a regular string but has .usage and .input_tokens etc.
 */
export class ChatResponseString extends String {
  private _cachedData: unknown = undefined;
  private _validationError: Error | null = null;

  constructor(
    content: string,
    public readonly usage: Usage,
    public readonly model: string,
    public readonly provider: string,
    public readonly thinking?: ThinkingResult,
    public readonly reasoning?: string | null,
    public readonly tool_calls?: ToolCall[],
    public readonly finish_reason?: string | null,
    public readonly schema?: Schema,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(content);
  }

  get finishReason() {
    return this.finish_reason;
  }

  get input_tokens() {
    return this.usage.input_tokens;
  }
  get output_tokens() {
    return this.usage.output_tokens;
  }
  get total_tokens() {
    return this.usage.total_tokens;
  }
  get cached_tokens() {
    return this.usage.cached_tokens;
  }
  get cost() {
    return this.usage.cost;
  }
  get input_cost() {
    return this.usage.input_cost;
  }
  get output_cost() {
    return this.usage.output_cost;
  }

  // --- CamelCase Aliases (for Developer Delight) ---
  get inputTokens() {
    return this.input_tokens;
  }
  get outputTokens() {
    return this.output_tokens;
  }
  get totalTokens() {
    return this.total_tokens;
  }
  get cachedTokens() {
    return this.cached_tokens;
  }

  get content(): string {
    return this.valueOf();
  }

  get model_id(): string {
    return this.model;
  }

  /**
   * Returns a serializable object containing all response metadata.
   * Perfect for database persistence.
   */
  get meta() {
    return {
      usage: this.usage,
      model: this.model,
      provider: this.provider,
      thinking: this.thinking,
      reasoning: this.reasoning,
      tool_calls: this.tool_calls,
      finish_reason: this.finish_reason,
      metadata: this.metadata
    };
  }

  /**
   * Alias for meta (backwards compatibility)
   */
  get raw() {
    return this.meta;
  }

  toString() {
    return this.valueOf();
  }

  /**
   * Return a new ChatResponseString with modified content but preserved metadata.
   */
  withContent(newContent: string): ChatResponseString {
    return new ChatResponseString(
      newContent,
      this.usage,
      this.model,
      this.provider,
      this.thinking,
      this.reasoning,
      this.tool_calls,
      this.finish_reason,
      this.schema,
      this.metadata
    );
  }

  /**
   * Attempt to extract and parse the content as JSON.
   */
  get parsed(): unknown {
    try {
      const cleanJson = extractJson(this.valueOf());
      return JSON.parse(cleanJson);
    } catch {
      return null;
    }
  }

  /**
   * Access the parsed data.
   * If a Zod schema was provided via .withSchema(), this will validate the data.
   * Throws ZodError if validation fails.
   */
  get data(): unknown {
    if (this._cachedData !== undefined) return this._cachedData;
    if (this._validationError) throw this._validationError;

    const json = this.parsed;

    if (this.schema && this.schema.definition.schema instanceof z.ZodType) {
      try {
        this._cachedData = this.schema.definition.schema.parse(json);
        return this._cachedData;
      } catch (e) {
        this._validationError = e as Error;
        throw e;
      }
    }

    this._cachedData = json;
    return json;
  }

  /**
   * Safe version of .data that returns null instead of throwing on validation error.
   */
  get safeData(): unknown {
    try {
      return this.data;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if the content contains valid JSON that matches the schema (if provided).
   */
  get isValid(): boolean {
    if (!this.schema) return this.parsed !== null;
    try {
      void this.data;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the validation error if the content doesn't match the schema.
   */
  get validationError(): Error | null {
    try {
      void this.data;
      return null;
    } catch (e) {
      return e as Error;
    }
  }
}
