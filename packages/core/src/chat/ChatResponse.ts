import { Usage } from "../providers/Provider.js";
import { ToolCall } from "./Tool.js";

/**
 * Enhanced string that includes token usage metadata.
 * Behaves like a regular string but has .usage and .input_tokens etc.
 */
export class ChatResponseString extends String {
  constructor(
    content: string,
    public readonly usage: Usage,
    public readonly model: string,
    public readonly provider: string,
    public readonly reasoning?: string | null,
    public readonly tool_calls?: ToolCall[]
  ) {
    super(content);
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

  get content(): string {
    return this.valueOf();
  }

  get model_id(): string {
    return this.model;
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
      this.reasoning,
      this.tool_calls
    );
  }

  /**
   * Attempt to parse the content as JSON.
   * Returns the parsed object or null if parsing fails.
   */
  get parsed(): unknown {
    try {
      return JSON.parse(this.valueOf());
    } catch {
      return null;
    }
  }
}
