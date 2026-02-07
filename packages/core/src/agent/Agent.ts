import { z } from "zod";
import { Chat, AskOptions } from "../chat/Chat.js";
import { ChatOptions } from "../chat/ChatOptions.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolResolvable } from "../chat/Tool.js";
import { ThinkingConfig } from "../providers/Provider.js";
import { Schema } from "../schema/Schema.js";
import { NodeLLM, NodeLLMCore } from "../llm.js";

/**
 * Configuration options that can be defined as static properties on Agent subclasses.
 */
export interface AgentConfig {
  /** The model ID to use (e.g., "gpt-4o", "claude-sonnet-4-20250514") */
  model?: string;

  /** The provider to use (e.g., "openai", "anthropic") */
  provider?: string;

  /** System instructions for the agent */
  instructions?: string;

  /** Tools available to the agent */
  tools?: ToolResolvable[];

  /** Temperature for response generation (0.0 - 1.0) */
  temperature?: number;

  /** Extended thinking configuration */
  thinking?: ThinkingConfig;

  /** Output schema for structured responses */
  schema?: z.ZodType | Schema | Record<string, unknown>;

  /** Provider-specific parameters */
  params?: Record<string, unknown>;

  /** Custom headers for requests */
  headers?: Record<string, string>;

  /** Maximum tokens in response */
  maxTokens?: number;

  /** Maximum tool call iterations */
  maxToolCalls?: number;

  /** Assume model exists without validation */
  assumeModelExists?: boolean;

  /** Optional LLM instance to use instead of global NodeLLM */
  llm?: NodeLLMCore;
}

/**
 * Base class for creating reusable, class-configured agents.
 *
 * Define your agent configuration using static properties, then instantiate
 * and use it anywhere in your application.
 *
 * @example
 * ```typescript
 * class SupportAgent extends Agent {
 *   static model = "gpt-4o";
 *   static instructions = "You are a helpful support agent";
 *   static tools = [SearchDocs, LookupAccount];
 *   static temperature = 0.2;
 * }
 *
 * const agent = new SupportAgent();
 * const response = await agent.ask("How can I reset my password?");
 * ```
 *
 * @example Override configuration per instance:
 * ```typescript
 * const agent = new SupportAgent({ model: "gpt-4o-mini" });
 * ```
 */
export abstract class Agent<S = unknown> {
  // Static configuration properties - override these in subclasses
  static model?: string;
  static provider?: string;
  static instructions?: string;
  static tools?: ToolResolvable[];
  static temperature?: number;
  static thinking?: ThinkingConfig;
  static schema?: z.ZodType | Schema | Record<string, unknown>;
  static params?: Record<string, unknown>;
  static headers?: Record<string, string>;
  static maxTokens?: number;
  static maxToolCalls?: number;
  static assumeModelExists?: boolean;

  /** The underlying Chat instance */
  protected readonly chat: Chat<S>;

  /**
   * Create a new agent instance.
   * @param overrides - Optional configuration to override static properties
   */
  constructor(overrides: Partial<AgentConfig & ChatOptions> = {}) {
    const ctor = this.constructor as typeof Agent;

    // Build chat options from static properties + overrides
    const chatOptions: ChatOptions = {
      provider: overrides.provider ?? ctor.provider,
      assumeModelExists: overrides.assumeModelExists ?? ctor.assumeModelExists,
      temperature: overrides.temperature ?? ctor.temperature,
      maxTokens: overrides.maxTokens ?? ctor.maxTokens,
      maxToolCalls: overrides.maxToolCalls ?? ctor.maxToolCalls,
      headers: { ...ctor.headers, ...overrides.headers },
      params: { ...ctor.params, ...overrides.params },
      thinking: overrides.thinking ?? ctor.thinking
    };

    // Determine model
    const model = overrides.model ?? ctor.model;
    if (!model) {
      throw new Error(
        `[Agent] No model specified. Set static model property or pass model in constructor.`
      );
    }

    // Use provided LLM instance or fall back to global NodeLLM
    const llm = overrides.llm ?? NodeLLM;
    this.chat = llm.chat(model, chatOptions) as Chat<S>;

    // Apply instructions
    const instructions = overrides.instructions ?? ctor.instructions;
    if (instructions) {
      this.chat.withInstructions(instructions);
    }

    // Apply tools
    const tools = overrides.tools ?? ctor.tools;
    if (tools && tools.length > 0) {
      this.chat.withTools(tools);
    }

    // Apply schema
    const schema = overrides.schema ?? ctor.schema;
    if (schema) {
      this.chat.withSchema(schema as z.ZodType<S>);
    }
  }

  /**
   * Send a message to the agent and get a response.
   * @param message - The user message
   * @param options - Optional request options
   */
  async ask(message: string, options?: AskOptions): Promise<ChatResponseString> {
    return this.chat.ask(message, options);
  }

  /**
   * Alias for ask()
   */
  async say(message: string, options?: AskOptions): Promise<ChatResponseString> {
    return this.ask(message, options);
  }

  /**
   * Stream a response from the agent.
   * @param message - The user message
   * @param options - Optional request options
   */
  stream(message: string, options?: AskOptions) {
    return this.chat.stream(message, options);
  }

  /**
   * Get the conversation history.
   */
  get history() {
    return this.chat.history;
  }

  /**
   * Get the model ID being used.
   */
  get modelId(): string {
    return this.chat.modelId;
  }

  /**
   * Get aggregate token usage across the conversation.
   */
  get totalUsage() {
    return this.chat.totalUsage;
  }

  /**
   * Access the underlying Chat instance for advanced operations.
   */
  get underlyingChat(): Chat<S> {
    return this.chat;
  }
}

/**
 * Helper function to define an agent inline without creating a class.
 *
 * @example
 * ```typescript
 * const SupportAgent = defineAgent({
 *   model: "gpt-4o",
 *   instructions: "You are a helpful support agent",
 *   tools: [SearchDocs, LookupAccount],
 *   temperature: 0.2
 * });
 *
 * const agent = new SupportAgent();
 * const response = await agent.ask("Help me!");
 * ```
 */
export function defineAgent<S = unknown>(
  config: AgentConfig
): new (overrides?: Partial<AgentConfig & ChatOptions>) => Agent<S> {
  return class extends Agent<S> {
    static override model = config.model;
    static override provider = config.provider;
    static override instructions = config.instructions;
    static override tools = config.tools;
    static override temperature = config.temperature;
    static override thinking = config.thinking;
    static override schema = config.schema;
    static override params = config.params;
    static override headers = config.headers;
    static override maxTokens = config.maxTokens;
    static override maxToolCalls = config.maxToolCalls;
    static override assumeModelExists = config.assumeModelExists;
  };
}
