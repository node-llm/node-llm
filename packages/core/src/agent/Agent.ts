import { z } from "zod";
import { Chat, AskOptions } from "../chat/Chat.js";
import { ChatOptions } from "../chat/ChatOptions.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolResolvable } from "../chat/Tool.js";
import { ThinkingConfig, ThinkingResult } from "../providers/Provider.js";
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
export abstract class Agent<S extends Record<string, unknown> = Record<string, unknown>> {
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

  /**
   * Hook called when the agent starts a new session (ask/stream).
   * @param context - Initial context including messages/options
   */
  static onStart(context: { messages: unknown[] }): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Hook called when the agent generates a reasoning trace (thinking).
   * @param thinking - The content of the thinking trace
   * @param result - The full response object containing the thinking
   */
  static onThinking(thinking: ThinkingResult, result: ChatResponseString): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Hook called when a tool execution starts.
   * @param toolCall - The tool call object (id, function name, arguments)
   */
  static onToolStart(toolCall: unknown): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Hook called when a tool execution ends.
   * @param toolCall - The tool call object
   * @param result - The result of the tool execution
   */
  static onToolEnd(toolCall: unknown, result: unknown): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Hook called when a tool execution encounters an error.
   * @param toolCall - The tool call object
   * @param error - The error that occurred
   */
  static onToolError(toolCall: unknown, error: Error): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Hook called when the agent completes a response turn.
   * @param result - The final response object
   */
  static onComplete(result: ChatResponseString): void | Promise<void> {
    // Override in subclass
  }

  // --- Static Execution API ---

  /**
   * Run the agent immediately with a prompt.
   * Creates a new instance of the agent, runs the prompt, and disposes it.
   *
   * @example
   * ```typescript
   * const result = await TravelAgent.ask("Find flights to Paris");
   * ```
   */
  static async ask(message: string, options?: AskOptions): Promise<ChatResponseString> {
    const Ctor = this as unknown as new (overrides?: Partial<AgentConfig & ChatOptions>) => Agent;
    const agent = new Ctor({});
    return agent.ask(message, options);
  }

  /**
   * Stream the agent response immediately.
   * Creates a new instance of the agent and streams the response.
   *
   * @example
   * ```typescript
   * for await (const chunk of TravelAgent.stream("Write a poem")) {
   *   process.stdout.write(chunk.content);
   * }
   * ```
   */
  static stream(message: string, options?: AskOptions) {
    const Ctor = this as unknown as new (overrides?: Partial<AgentConfig & ChatOptions>) => Agent;
    const agent = new Ctor({});
    return agent.stream(message, options);
  }

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
      thinking: overrides.thinking ?? ctor.thinking,
      messages: overrides.messages // Allow history injection
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

    // Wire up global/static telemetry hooks

    // Trigger onStart immediately
    if (ctor.onStart) {
      this.chat.beforeRequest(async (messages) => {
        if (ctor.onStart) {
          await ctor.onStart({ messages });
        }
      });
    }

    if (ctor.onToolStart) {
      this.chat.onToolCallStart(async (toolCall) => {
        await ctor.onToolStart(toolCall);
      });
    }

    if (ctor.onToolEnd) {
      this.chat.onToolCallEnd(async (toolCall, result) => {
        await ctor.onToolEnd(toolCall, result);
      });
    }

    if (ctor.onToolError) {
      this.chat.onToolCallError(async (toolCall, error) => {
        await ctor.onToolError(toolCall, error);
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
export function defineAgent<S extends Record<string, unknown> = Record<string, unknown>>(
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
