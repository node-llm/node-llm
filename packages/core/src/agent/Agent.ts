import { z } from "zod";
import { Chat, AskOptions } from "../chat/Chat.js";
import { ChatOptions } from "../chat/ChatOptions.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolResolvable } from "../chat/Tool.js";
import { ThinkingConfig, ThinkingResult } from "../providers/Provider.js";
import { Schema } from "../schema/Schema.js";
import { NodeLLM, NodeLLMCore } from "../llm.js";

/**
 * A value that can be a static T or a function that returns T based on inputs.
 */
export type LazyValue<T, I = any> = T | ((inputs: I) => T);

/**
 * Configuration options for Agent.
 */
export interface AgentConfig<I = any> {
  /** The model ID to use (e.g., "gpt-4o") */
  model?: string;

  /** The provider to use (e.g., "openai") */
  provider?: string;

  /** System instructions for the agent (can be lazy) */
  instructions?: LazyValue<string, I>;

  /** Tools available to the agent (can be lazy) */
  tools?: LazyValue<ToolResolvable[], I>;

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

  /** Optional initial inputs to resolve lazy config immediately */
  inputs?: I;
}

/**
 * Base class for creating reusable, class-configured agents.
 */
export abstract class Agent<
  I extends Record<string, any> = Record<string, any>,
  S extends Record<string, unknown> = Record<string, unknown>
> {
  // Static configuration properties - override these in subclasses
  static model?: string;
  static provider?: string;
  static instructions?: LazyValue<string, any>;
  static tools?: LazyValue<ToolResolvable[], any>;
  static temperature?: number;
  static thinking?: ThinkingConfig;
  static schema?: z.ZodType | Schema | Record<string, unknown>;
  static params?: Record<string, unknown>;
  static headers?: Record<string, string>;
  static maxTokens?: number;
  static maxToolCalls?: number;
  static assumeModelExists?: boolean;

  /**
   * Explicitly declare which inputs this agent expects.
   * Useful for introspection and validation.
   */
  static inputs?: string[];

  /**
   * Hook called when the agent starts a new session (ask/stream).
   */
  static onStart(_context: { messages: unknown[] }): void | Promise<void> {
    // Override in subclass
  }

  static onThinking(_thinking: ThinkingResult, _result: ChatResponseString): void | Promise<void> {
    // Override in subclass
  }

  static onToolStart(_toolCall: unknown): void | Promise<void> {
    // Override in subclass
  }

  static onToolEnd(_toolCall: unknown, _result: unknown): void | Promise<void> {
    // Override in subclass
  }

  static onToolError(_toolCall: unknown, _error: Error): void | Promise<void> {
    // Override in subclass
  }

  static onComplete(_result: ChatResponseString): void | Promise<void> {
    // Override in subclass
  }

  // --- Static Execution API ---

  /**
   * Run the agent immediately with a prompt.
   */
  static async ask<I extends Record<string, any>, S extends Record<string, any>>(
    this: new (overrides?: Partial<AgentConfig<I> & ChatOptions>) => Agent<I, S>,
    message: string,
    options?: AskOptions & { inputs?: I }
  ): Promise<ChatResponseString> {
    const agent = new this({ ...options });
    return agent.ask(message, options);
  }

  /**
   * Stream the agent response immediately.
   */
  static stream<I extends Record<string, any>, S extends Record<string, any>>(
    this: new (overrides?: Partial<AgentConfig<I> & ChatOptions>) => Agent<I, S>,
    message: string,
    options?: AskOptions & { inputs?: I }
  ) {
    const agent = new this({ ...options });
    return agent.stream(message, options);
  }

  /** The underlying Chat instance */
  protected readonly chat: Chat<S>;

  /** Private reference to configuration overrides for lazy resolution */
  private readonly config: Partial<AgentConfig<I> & ChatOptions>;

  /**
   * Create a new agent instance.
   * @param overrides - Optional configuration to override static properties
   */
  constructor(overrides: Partial<AgentConfig<I> & ChatOptions> = {}) {
    this.config = overrides;
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
      thinking: overrides.thinking ?? ctor.thinking,
      messages: overrides.messages
    };

    // Determine model
    const model = overrides.model ?? ctor.model;
    if (!model) {
      throw new Error(
        `[Agent] No model specified. Set static model property or pass model in constructor.`
      );
    }

    const llm = overrides.llm ?? NodeLLM;
    this.chat = llm.chat(model, chatOptions) as Chat<S>;

    // Initial resolution if inputs are provided in constructor
    if (overrides.inputs) {
      this.resolveLazyConfig(overrides.inputs);
    } else {
      // Fallback: apply static/direct instructions immediately if they aren't functions
      const instructions = overrides.instructions ?? ctor.instructions;
      if (instructions && typeof instructions !== "function") {
        this.chat.withInstructions(instructions);
      }

      const tools = overrides.tools ?? ctor.tools;
      if (tools && typeof tools !== "function" && tools.length > 0) {
        this.chat.withTools(tools);
      }
    }

    // Apply schema
    const schema = overrides.schema ?? ctor.schema;
    if (schema) {
      this.chat.withSchema(schema as z.ZodType<S>);
    }

    // Wire up telemetry hooks
    if (ctor.onStart) {
      this.chat.beforeRequest(async (messages) => {
        if (ctor.onStart) await ctor.onStart({ messages });
      });
    }

    if (ctor.onToolStart) {
      this.chat.onToolCallStart(async (toolCall) => {
        if (ctor.onToolStart) await ctor.onToolStart(toolCall);
      });
    }

    if (ctor.onToolEnd) {
      this.chat.onToolCallEnd(async (toolCall, result) => {
        if (ctor.onToolEnd) await ctor.onToolEnd(toolCall, result);
      });
    }

    if (ctor.onToolError) {
      this.chat.onToolCallError(async (toolCall, error) => {
        if (ctor.onToolError) await ctor.onToolError(toolCall, error);
      });
    }

    if (ctor.onComplete || ctor.onThinking) {
      this.chat.onEndMessage(async (msg) => {
        if (msg.thinking && ctor.onThinking) {
          await ctor.onThinking(msg.thinking, msg);
        }
        if (ctor.onComplete) {
          await ctor.onComplete(msg);
        }
      });
    }
  }

  /**
   * Helper to resolve lazy instructions and tools based on inputs.
   */
  private resolveLazyConfig(inputs?: I) {
    if (!inputs) return;

    const ctor = this.constructor as typeof Agent;

    // 1. Resolve Instructions
    let instructions = this.config.instructions ?? ctor.instructions;
    if (typeof instructions === "function") {
      instructions = (instructions as (i: I) => string)(inputs);
    }
    if (typeof instructions === "string") {
      this.chat.withInstructions(instructions as string, { replace: true });
    }

    // 2. Resolve Tools
    let tools = this.config.tools ?? ctor.tools;
    if (typeof tools === "function") {
      tools = (tools as (i: I) => ToolResolvable[])(inputs);
    }
    if (Array.isArray(tools)) {
      this.chat.withTools(tools as ToolResolvable[], { replace: true });
    }
  }

  // --- Fluent Configuration ---

  /**
   * Add instructions to the agent (replaces or appends).
   */
  withInstructions(instructions: string, options?: { replace?: boolean }): this {
    this.chat.withInstructions(instructions, options);
    return this;
  }

  /**
   * Add tools to the agent.
   */
  withTools(tools: ToolResolvable[], options?: { replace?: boolean }): this {
    this.chat.withTools(tools, options);
    return this;
  }

  /**
   * Alias for withTools([tool]).
   */
  use(tool: ToolResolvable): this {
    return this.withTools([tool]);
  }

  /**
   * Send a message to the agent and get a response.
   */
  async ask(message: string, options?: AskOptions & { inputs?: I }): Promise<ChatResponseString> {
    if (options?.inputs) {
      this.resolveLazyConfig(options.inputs);
    }
    return this.chat.ask(message, options);
  }

  /**
   * Hook called when a tool call starts.
   */
  onToolCallStart(handler: (toolCall: any) => void | Promise<void>): this {
    this.chat.onToolCallStart(handler);
    return this;
  }

  /**
   * Hook called when a tool call ends.
   */
  onToolCallEnd(handler: (toolCall: any, result: any) => void | Promise<void>): this {
    this.chat.onToolCallEnd(handler);
    return this;
  }

  /**
   * Hook called when a tool call errors.
   */
  onToolCallError(handler: (toolCall: any, error: Error) => any): this {
    this.chat.onToolCallError(handler);
    return this;
  }

  /**
   * Hook called before a request.
   */
  beforeRequest(handler: (messages: any[]) => any): this {
    this.chat.beforeRequest(handler);
    return this;
  }

  /**
   * Hook called after a response.
   */
  afterResponse(handler: (response: ChatResponseString) => any): this {
    this.chat.afterResponse(handler);
    return this;
  }

  /**
   * Alias for ask()
   */
  async say(message: string, options?: AskOptions & { inputs?: I }): Promise<ChatResponseString> {
    return this.ask(message, options);
  }

  /**
   * Stream a response from the agent.
   */
  stream(message: string, options?: AskOptions & { inputs?: I }) {
    if (options?.inputs) {
      this.resolveLazyConfig(options.inputs);
    }
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
 */
export function defineAgent<
  I extends Record<string, any> = Record<string, any>,
  S extends Record<string, unknown> = Record<string, unknown>
>(config: AgentConfig<I>): new (overrides?: Partial<AgentConfig<I> & ChatOptions>) => Agent<I, S> {
  return class extends Agent<I, S> {
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
