import {
  ChatOptions,
  AskOptions,
  NodeLLMCore,
  Agent,
  AgentConfig,
  Message,
  ChatChunk,
  Usage,
  ToolCall
} from "@node-llm/core";

/**
 * Internal interface for dynamic Prisma Client access.
 * We use 'any' here because PrismaClient has no index signature by default,
 * making it hard to access models dynamically by string name.
 */
import type { ChatStore } from "../../Store.js";
import { toStore } from "./PrismaStore.js";
import { storedHistory } from "../../history.js";
import { StoppedByStoreError } from "../../errors.js";

/** What an agent's answers parse to: its schema's type, or unknown without one. */
export type AgentData<T> = T extends Agent<any, infer S> ? S : unknown;

/**
 * The saved assistant message, with the answer's parsed `data`: checked against the agent's schema
 * when it has a Zod one, and found inside a code fence or surrounding text. Reading `data` throws
 * the schema's error when the answer doesn't match. `data` isn't a column, so it isn't saved or
 * sent when the record is serialized.
 */
export type AgentAnswer<T> = MessageRecord & { readonly data: AgentData<T> };

function withData<T>(record: MessageRecord, response: { data: unknown }): AgentAnswer<T> {
  Object.defineProperty(record, "data", {
    get: () => response.data,
    enumerable: false,
    configurable: true
  });
  return record as AgentAnswer<T>;
}

/**
 * Record structure for the LLM Agent Session table.
 */
export interface AgentSessionRecord {
  id: string;
  agentClass: string;
  chatId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Record structure for the LLM Message table.
 */
export interface MessageRecord {
  id: string;
  chatId: string;
  role: string;
  content: string | null;
  contentRaw?: string | null;
  thinkingText?: string | null;
  thinkingSignature?: string | null;
  thinkingTokens?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  modelId?: string | null;
  provider?: string | null;
  createdAt: Date;
}

/**
 * Table name customization.
 */
export interface TableNames {
  agentSession?: string;
  chat?: string;
  message?: string;
  toolCall?: string;
  request?: string;
}

/**
 * Internal interface for dynamic Prisma model access
 */
type AgentClass<T extends Agent<any, any> = Agent<any, any>> = (new (
  overrides?: Partial<AgentConfig<any> & ChatOptions>
) => T) & {
  name: string;
  model?: string;
  instructions?: unknown;
  tools?: unknown;
};

/**
 * AgentSession - Wraps an Agent instance with persistence capabilities.
 *
 * Follows "Code Wins" sovereignty:
 * - Model, Tools, Instructions come from the Agent class (code)
 * - Message history comes from the database
 * - Metadata from DB is injected as 'inputs' for dynamic resolution
 *
 * @example
 * ```typescript
 * // Create a new session
 * const session = await createAgentSession(prisma, llm, SupportAgent, {
 *   metadata: { userId: "123" }
 * });
 *
 * // Resume a session
 * const session = await loadAgentSession(prisma, llm, SupportAgent, "sess_abc");
 *
 * // Agent behavior is always defined in code
 * const result = await session.ask("Hello");
 * ```
 */
export class AgentSession<
  I extends Record<string, any> = Record<string, any>,
  T extends Agent<I, any> = Agent<I, any>
> {
  private currentMessageId: string | null = null;
  /** Set when the store asks to stop; the next request throws it instead */
  private stopReason?: string;
  private store: ChatStore;
  private debug: boolean;

  constructor(
    prismaOrStore: unknown,
    private llm: NodeLLMCore,
    private AgentClass: AgentClass<T>,
    private record: AgentSessionRecord,
    tableNames?: TableNames,
    private agent: T = new AgentClass({
      llm,
      inputs: record.metadata as I
    }),
    debug: boolean = false
  ) {
    this.debug = debug;
    this.store = toStore(prismaOrStore, tableNames);

    this.registerHooks();
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log(`[@node-llm/orm]`, ...args);
    }
  }

  /** Agent instance (for direct access if needed) */
  get instance(): T {
    return this.agent;
  }

  /** Session ID for persistence */
  get id(): string {
    return this.record.id;
  }

  /** Underlying chat ID */
  get chatId(): string {
    return this.record.chatId;
  }

  /** Session metadata */
  get metadata(): I | null | undefined {
    return this.record.metadata as I;
  }

  /** Agent class name */
  get agentClass(): string {
    return this.record.agentClass;
  }

  /** Model ID used by the agent */
  get modelId(): string {
    return this.agent.modelId;
  }

  /** Cumulative usage for this session (from agent memory) */
  get totalUsage(): Usage {
    return this.agent.totalUsage;
  }

  /** Current in-memory message history */
  get history(): readonly Message[] {
    return this.agent.history;
  }

  /**
   * Helper to get a typed Prisma model by its dynamic name.
   */
  /**
   * Register persistence hooks on the agent.
   */
  private registerHooks() {
    this.agent.onToolCallStart(async (tc) => {
      const toolCall = tc as ToolCall;
      if (!this.currentMessageId) return;
      await this.store.createToolCall({
        messageId: this.currentMessageId,
        toolCallId: toolCall.id,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
        thoughtSignature: toolCall.thought_signature ?? null
      });
    });

    this.agent.onToolCallEnd(async (tc, result) => {
      const toolCall = tc as ToolCall;
      if (!this.currentMessageId) return;
      try {
        await this.store.finishToolCall(this.currentMessageId, toolCall.id, {
          result: typeof result === "string" ? result : JSON.stringify(result)
        });
      } catch (e) {
        this.log(`Failed to update tool call result: ${e}`);
      }
    });

    this.agent.beforeRequest(async () => {
      if (this.stopReason !== undefined) throw new StoppedByStoreError(this.stopReason);
    });

    this.agent.afterResponse(async (response) => {
      const recorded = await this.store.createRequest({
        chatId: this.chatId,
        messageId: this.currentMessageId,
        provider: response.provider || "unknown",
        model: response.model || "unknown",
        statusCode: 200,
        duration: (response as { latency?: number }).latency || 0,
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        cachedTokens: response.usage?.cached_tokens,
        cost: response.usage?.cost || 0
      });
      if (recorded && recorded.stop !== undefined) this.stopReason = recorded.stop;
    });
  }

  /**
   * Records a call made outside the agent's own requests, such as a tool asking another model
   * about an image: as a request row of this chat, under the answer being written now, and in the
   * agent's usage, so `stats()`, `totalUsage` and the ask's `maxCost` all include it.
   */
  async countCall(response: {
    usage?: Usage;
    model?: string;
    provider?: string;
    latency?: number;
  }): Promise<void> {
    const usage = response.usage;
    if (!usage) return;
    this.agent.countUsage(usage);
    await this.store.createRequest({
      chatId: this.chatId,
      messageId: this.currentMessageId,
      provider: response.provider || "unknown",
      model: response.model || "unknown",
      statusCode: 200,
      duration: response.latency || 0,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cachedTokens: usage.cached_tokens,
      cost: usage.cost || 0
    });
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(message: string, options: AskOptions & { inputs?: I } = {}): Promise<AgentAnswer<T>> {
    // Persist user message
    await this.store.createMessage({ chatId: this.chatId, role: "user", content: message });

    // Create placeholder for assistant message
    const assistantMessage = await this.store.createMessage({
      chatId: this.chatId,
      role: "assistant",
      content: null
    });

    this.currentMessageId = assistantMessage.id;

    try {
      // Merge turn-level inputs with session metadata
      const inputs = { ...(this.record.metadata as I), ...options.inputs };

      // Get response from agent (uses code-defined config + injected history)
      const response = await this.agent.ask(message, { ...options, inputs });

      // Update assistant message with response
      const saved = (await this.store.updateMessage(assistantMessage.id, {
        content: response.content,
        contentRaw: JSON.stringify(response.meta),
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        thinkingText: response.thinking?.text || null,
        thinkingSignature: response.thinking?.signature || null,
        thinkingTokens: response.thinking?.tokens || null,
        modelId: response.model || null,
        provider: response.provider || null
      })) as MessageRecord;
      return withData<T>(saved, response);
    } catch (error) {
      // Clean up placeholder on error
      await this.store.deleteMessage(assistantMessage.id);
      throw error;
    }
  }

  /**
   * Stream a response and persist the conversation.
   */
  async *askStream(
    message: string,
    options: AskOptions & { inputs?: I } = {}
  ): AsyncGenerator<ChatChunk, MessageRecord, undefined> {
    // Persist user message
    await this.store.createMessage({ chatId: this.chatId, role: "user", content: message });

    // Create placeholder for assistant message
    const assistantMessage = await this.store.createMessage({
      chatId: this.chatId,
      role: "assistant",
      content: null
    });

    this.currentMessageId = assistantMessage.id;

    try {
      // Merge turn-level inputs with session metadata
      const inputs = { ...(this.record.metadata as I), ...options.inputs };
      const stream = this.agent.stream(message, { ...options, inputs });

      let fullContent = "";
      let lastChunk: ChatChunk | null = null;

      for await (const chunk of stream) {
        fullContent += chunk.content;
        lastChunk = chunk;
        yield chunk;
      }

      // Final update with accumulated result
      return (await this.store.updateMessage(assistantMessage.id, {
        content: fullContent,
        inputTokens: lastChunk?.usage?.input_tokens || 0,
        outputTokens: lastChunk?.usage?.output_tokens || 0,
        thinkingText: lastChunk?.thinking?.text || null,
        thinkingSignature: lastChunk?.thinking?.signature || null,
        thinkingTokens: lastChunk?.thinking?.tokens || null,
        modelId: (lastChunk?.metadata?.model as string) || null,
        provider: (lastChunk?.metadata?.provider as string) || null
      })) as MessageRecord;
    } catch (error) {
      await this.store.deleteMessage(assistantMessage.id);
      throw error;
    }
  }

  /**
   * Returns a usage summary for this chat session.
   */
  async stats(): Promise<Usage> {
    const totals = await this.store.requestTotals(this.chatId);

    return {
      input_tokens: totals.inputTokens,
      output_tokens: totals.outputTokens,
      total_tokens: totals.inputTokens + totals.outputTokens,
      cost: totals.cost
    };
  }

  /**
   * Add a tool to the session (turn-level).
   */
  withTool(tool: any): this {
    this.agent.use(tool);
    return this;
  }

  /**
   * Add instructions to the session (turn-level).
   */
  withInstructions(instructions: string, options?: { replace?: boolean }): this {
    this.agent.withInstructions(instructions, options);
    return this;
  }

  /**
   * Returns the current full message history for this session.
   */
  async messages(): Promise<MessageRecord[]> {
    return (await this.store.listMessages(this.chatId)) as MessageRecord[];
  }

  /**
   * Delete the entire session and its history.
   */
  async delete(): Promise<void> {
    await this.store.deleteChat(this.chatId);
    // AgentSession record is deleted via Cascade from LlmChat
  }

  /**
   * Update session metadata and re-resolve agent configuration.
   */
  async updateMetadata(metadata: Partial<I>): Promise<void> {
    const newMetadata = { ...(this.record.metadata as I), ...metadata };

    await this.store.updateAgentSession(this.id, { metadata: newMetadata as any });

    this.record.metadata = newMetadata as any;

    // Apply changes to the underlying agent immediately
    // resolveLazyConfig is private, so we need a cast or make it protected.
    // Given we are in the same package, we can cast.
    (this.agent as any).resolveLazyConfig(newMetadata);
  }
}

/**
 * Agent settings for one session, in place of the agent class's own, such as `maxCost` or
 * `maxToolCalls` for a run with its own budget. Not kept in the store: pass them again to
 * loadAgentSession().
 */
export type AgentSessionOverrides<I = any> = Omit<
  Partial<AgentConfig<I>>,
  "llm" | "inputs" | "tools" | "schema"
> & {
  /** Tools for this session, in place of the ones the agent class defines */
  tools?: ChatOptions["tools"];
};

/**
 * Options for creating a new agent session.
 */
export interface CreateAgentSessionOptions<I = any> extends AgentSessionOverrides<I> {
  metadata?: I;
  tableNames?: TableNames;
  debug?: boolean;
  instructions?: string;
}

/** The agent settings in session options, leaving out the session's own options. */
function agentOverrides<I>(
  options: AgentSessionOverrides<I> & { metadata?: unknown; tableNames?: unknown; debug?: unknown }
): AgentSessionOverrides<I> {
  const { metadata: _metadata, tableNames: _tableNames, debug: _debug, ...overrides } = options;
  return Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined)
  ) as AgentSessionOverrides<I>;
}

/**
 * Creates a new agent session and its persistent chat record.
 */
export async function createAgentSession<I extends Record<string, any>, T extends Agent<I, any>>(
  prismaOrStore: unknown,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  options: CreateAgentSessionOptions<I> = {}
): Promise<AgentSession<I, T>> {
  const store = toStore(prismaOrStore, options.tableNames);

  if (options.debug) {
    console.log(`[@node-llm/orm] createAgentSession: agentClass=${AgentClass.name}`);
  }

  // 1. Create underlying LlmChat record
  const chatRecord = await store.createChat({
    model: options.model || AgentClass.model || null,
    provider: options.provider || null,
    instructions:
      options.instructions ||
      (typeof AgentClass.instructions === "string" ? AgentClass.instructions : null),
    metadata: null // Runtime metadata goes in Chat, session context in AgentSession
  });

  // 2. Create AgentSession record
  const sessionRecord = (await store.createAgentSession({
    agentClass: AgentClass.name,
    chatId: chatRecord.id,
    metadata: (options.metadata as any) || null
  })) as AgentSessionRecord;

  // 3. Instantiate Agent with overrides
  const agent = new AgentClass({
    ...agentOverrides<I>(options),
    llm,
    inputs: sessionRecord.metadata as I
  });

  return new AgentSession<I, T>(
    store,
    llm,
    AgentClass,
    sessionRecord,
    options.tableNames,
    agent,
    options.debug
  );
}

/**
 * Options for loading an existing agent session.
 */
export interface LoadAgentSessionOptions<I = any> extends AgentSessionOverrides<I> {
  tableNames?: TableNames;
  debug?: boolean;
}

/**
 * Loads an existing agent session and re-instantiates the agent with history.
 */
export async function loadAgentSession<I extends Record<string, any>, T extends Agent<I, any>>(
  prismaOrStore: unknown,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  sessionId: string,
  options: LoadAgentSessionOptions<I> = {}
): Promise<AgentSession<I, T> | null> {
  const store = toStore(prismaOrStore, options.tableNames);

  if (options.debug) {
    console.log(`[@node-llm/orm] loadAgentSession: id=${sessionId}`);
  }

  // 1. Find session record
  const sessionRecord = (await store.findAgentSession(sessionId)) as AgentSessionRecord | null;

  if (!sessionRecord) {
    return null;
  }

  // 1.5. Validate Agent Class (Code Wins Sovereignty)
  if (sessionRecord.agentClass !== AgentClass.name) {
    throw new Error(
      `Agent class mismatch: Session "${sessionId}" was created for "${sessionRecord.agentClass}", but is being loaded with "${AgentClass.name}".`
    );
  }

  // 2. Load message history, with the tool calls of earlier turns when the store keeps them
  const messages = (await store.listMessages(sessionRecord.chatId)) as MessageRecord[];
  const toolCalls = store.listToolCalls
    ? await store.listToolCalls(messages.map((message) => message.id))
    : [];

  // 3. Convert DB records to NodeLLM messages
  const history: Message[] = storedHistory(messages, toolCalls);

  // 4. Instantiate agent with injected history, LLM, AND metadata (as inputs)
  // "Code Wins" - model, tools, instructions come from AgentClass
  // Metadata from DB handles the lazy resolution of behavior
  const agent = new AgentClass({
    ...agentOverrides<I>(options),
    llm,
    messages: history,
    inputs: sessionRecord.metadata as I
  }) as T;

  return new AgentSession<I, T>(
    store,
    llm,
    AgentClass,
    sessionRecord,
    options.tableNames,
    agent,
    options.debug
  );
}

/**
 * Dynamic helper to access Prisma models by name.
 * Handles both case-sensitive and case-insensitive lookups for flexibility.
 */
