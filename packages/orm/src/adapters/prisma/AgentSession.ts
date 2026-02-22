import {
  ChatOptions,
  AskOptions,
  NodeLLMCore,
  Agent,
  AgentConfig,
  Message,
  ChatChunk,
  Usage
} from "@node-llm/core";

/**
 * Internal interface for dynamic Prisma Client access.
 * We use 'any' here because PrismaClient has no index signature by default,
 * making it hard to access models dynamically by string name.
 */
type GenericPrismaClient = any;

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
interface PrismaModel<T = Record<string, unknown>> {
  create(args: { data: Record<string, unknown> }): Promise<T>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<void>;
  findMany(args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, string>;
  }): Promise<T[]>;
  findUnique(args: { where: { id: string } }): Promise<T | null>;
}

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
  private tableNames: Required<TableNames>;
  private debug: boolean;

  constructor(
    private prisma: any,
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
    this.tableNames = {
      agentSession: tableNames?.agentSession || "llmAgentSession",
      chat: tableNames?.chat || "llmChat",
      message: tableNames?.message || "llmMessage",
      toolCall: tableNames?.toolCall || "llmToolCall",
      request: tableNames?.request || "llmRequest"
    };

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
  private getModel<R = Record<string, unknown>>(name: string): PrismaModel<R> {
    return getTable(this.prisma, name) as unknown as PrismaModel<R>;
  }

  /**
   * Register persistence hooks on the agent.
   */
  private registerHooks() {
    this.agent.onToolCallStart(async (toolCall) => {
      if (!this.currentMessageId) return;
      const model = this.getModel(this.tableNames.toolCall);
      await model.create({
        data: {
          messageId: this.currentMessageId,
          toolCallId: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        }
      });
    });

    this.agent.onToolCallEnd(async (toolCall, result) => {
      if (!this.currentMessageId) return;
      const model = this.getModel(this.tableNames.toolCall);
      try {
        await model.update({
          where: {
            messageId_toolCallId: {
              messageId: this.currentMessageId,
              toolCallId: toolCall.id
            }
          } as any,
          data: {
            result: typeof result === "string" ? result : JSON.stringify(result)
          }
        });
      } catch (e) {
        this.log(`Failed to update tool call result: ${e}`);
      }
    });

    this.agent.afterResponse(async (response) => {
      const model = this.getModel(this.tableNames.request);
      await model.create({
        data: {
          chatId: this.chatId,
          messageId: this.currentMessageId,
          provider: response.provider || "unknown",
          model: response.model || "unknown",
          statusCode: 200,
          duration: 0,
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          cost: response.usage?.cost || 0
        }
      });
    });
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(message: string, options: AskOptions & { inputs?: I } = {}): Promise<MessageRecord> {
    const model = this.getModel<MessageRecord>(this.tableNames.message);

    // Persist user message
    await model.create({
      data: { chatId: this.chatId, role: "user", content: message }
    });

    // Create placeholder for assistant message
    const assistantMessage = await model.create({
      data: { chatId: this.chatId, role: "assistant", content: null }
    });

    this.currentMessageId = assistantMessage.id;

    try {
      // Merge turn-level inputs with session metadata
      const inputs = { ...(this.record.metadata as I), ...options.inputs };

      // Get response from agent (uses code-defined config + injected history)
      const response = await this.agent.ask(message, { ...options, inputs });

      // Update assistant message with response
      return await model.update({
        where: { id: assistantMessage.id },
        data: {
          content: response.content,
          contentRaw: JSON.stringify(response.meta),
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          thinkingText: response.thinking?.text || null,
          thinkingSignature: response.thinking?.signature || null,
          thinkingTokens: response.thinking?.tokens || null,
          modelId: response.model || null,
          provider: response.provider || null
        }
      });
    } catch (error) {
      // Clean up placeholder on error
      await model.delete({ where: { id: assistantMessage.id } });
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
    const model = this.getModel<MessageRecord>(this.tableNames.message);

    // Persist user message
    await model.create({
      data: { chatId: this.chatId, role: "user", content: message }
    });

    // Create placeholder for assistant message
    const assistantMessage = await model.create({
      data: { chatId: this.chatId, role: "assistant", content: null }
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
      return await model.update({
        where: { id: assistantMessage.id },
        data: {
          content: fullContent,
          inputTokens: lastChunk?.usage?.input_tokens || 0,
          outputTokens: lastChunk?.usage?.output_tokens || 0,
          thinkingText: lastChunk?.thinking?.text || null,
          thinkingSignature: lastChunk?.thinking?.signature || null,
          thinkingTokens: lastChunk?.thinking?.tokens || null,
          modelId: (lastChunk?.metadata?.model as string) || null,
          provider: (lastChunk?.metadata?.provider as string) || null
        }
      });
    } catch (error) {
      await model.delete({ where: { id: assistantMessage.id } });
      throw error;
    }
  }

  /**
   * Returns a usage summary for this chat session.
   */
  async stats(): Promise<Usage> {
    const requestModel = getTable(this.prisma, this.tableNames.request);
    const aggregate = await (requestModel as any).aggregate({
      where: { chatId: this.chatId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true
      }
    });

    return {
      input_tokens: Number(aggregate._sum.inputTokens || 0),
      output_tokens: Number(aggregate._sum.outputTokens || 0),
      total_tokens: Number((aggregate._sum.inputTokens || 0) + (aggregate._sum.outputTokens || 0)),
      cost: Number(aggregate._sum.cost || 0)
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
    const model = this.getModel<MessageRecord>(this.tableNames.message);
    return await model.findMany({
      where: { chatId: this.chatId },
      orderBy: { createdAt: "asc" }
    });
  }

  /**
   * Delete the entire session and its history.
   */
  async delete(): Promise<void> {
    const chatTable = this.getModel(this.tableNames.chat);
    await chatTable.delete({ where: { id: this.chatId } });
    // AgentSession record is deleted via Cascade from LlmChat
  }

  /**
   * Update session metadata and re-resolve agent configuration.
   */
  async updateMetadata(metadata: Partial<I>): Promise<void> {
    const sessionTable = this.getModel<AgentSessionRecord>(this.tableNames.agentSession);
    const newMetadata = { ...(this.record.metadata as I), ...metadata };

    await sessionTable.update({
      where: { id: this.id },
      data: { metadata: newMetadata as any }
    });

    this.record.metadata = newMetadata as any;

    // Apply changes to the underlying agent immediately
    // resolveLazyConfig is private, so we need a cast or make it protected.
    // Given we are in the same package, we can cast.
    (this.agent as any).resolveLazyConfig(newMetadata);
  }
}

/**
 * Options for creating a new agent session.
 */
export interface CreateAgentSessionOptions<I = any> {
  metadata?: I;
  tableNames?: TableNames;
  debug?: boolean;
  model?: string;
  provider?: string;
  instructions?: string;
  maxToolCalls?: number;
}

/**
 * Creates a new agent session and its persistent chat record.
 */
export async function createAgentSession<I extends Record<string, any>, T extends Agent<I, any>>(
  prisma: any,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  options: CreateAgentSessionOptions<I> = {}
): Promise<AgentSession<I, T>> {
  const tableNames = {
    agentSession: options.tableNames?.agentSession || "llmAgentSession",
    chat: options.tableNames?.chat || "llmChat",
    message: options.tableNames?.message || "llmMessage"
  };

  if (options.debug) {
    console.log(`[@node-llm/orm] createAgentSession: agentClass=${AgentClass.name}`);
  }

  // 1. Create underlying LlmChat record
  const chatTable = getTable(prisma, tableNames.chat);
  const chatRecord = (await chatTable.create({
    data: {
      model: options.model || AgentClass.model || null,
      provider: options.provider || null,
      instructions:
        options.instructions ||
        (typeof AgentClass.instructions === "string" ? AgentClass.instructions : null),
      metadata: null // Runtime metadata goes in Chat, session context in AgentSession
    }
  })) as unknown as { id: string };

  // 2. Create AgentSession record
  const sessionTable = getTable(prisma, tableNames.agentSession);
  const sessionRecord = (await sessionTable.create({
    data: {
      agentClass: AgentClass.name,
      chatId: chatRecord.id,
      metadata: (options.metadata as any) || null
    }
  })) as unknown as AgentSessionRecord;

  // 3. Instantiate Agent with overrides
  const agent = new AgentClass({
    llm,
    inputs: sessionRecord.metadata as I,
    model: options.model,
    provider: options.provider,
    instructions: options.instructions,
    maxToolCalls: options.maxToolCalls
  });

  return new AgentSession<I, T>(
    prisma,
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
export interface LoadAgentSessionOptions {
  tableNames?: TableNames;
  debug?: boolean;
}

/**
 * Loads an existing agent session and re-instantiates the agent with history.
 */
export async function loadAgentSession<I extends Record<string, any>, T extends Agent<I, any>>(
  prisma: any,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  sessionId: string,
  options: LoadAgentSessionOptions = {}
): Promise<AgentSession<I, T> | null> {
  const tableNames = {
    agentSession: options.tableNames?.agentSession || "llmAgentSession",
    chat: options.tableNames?.chat || "llmChat",
    message: options.tableNames?.message || "llmMessage"
  };

  if (options.debug) {
    console.log(`[@node-llm/orm] loadAgentSession: id=${sessionId}`);
  }

  // 1. Find session record
  const sessionTable = getTable(prisma, tableNames.agentSession);
  const sessionRecord = (await sessionTable.findUnique({
    where: { id: sessionId }
  })) as unknown as AgentSessionRecord | null;

  if (!sessionRecord) {
    return null;
  }

  // 1.5. Validate Agent Class (Code Wins Sovereignty)
  if (sessionRecord.agentClass !== AgentClass.name) {
    throw new Error(
      `Agent class mismatch: Session "${sessionId}" was created for "${sessionRecord.agentClass}", but is being loaded with "${AgentClass.name}".`
    );
  }

  // 2. Load message history
  const messageTable = getTable(prisma, tableNames.message);
  const messages = (await messageTable.findMany({
    where: { chatId: sessionRecord.chatId },
    orderBy: { createdAt: "asc" }
  })) as unknown as MessageRecord[];

  // 3. Convert DB messages to NodeLLM Message format
  const history: Message[] = messages.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content || ""
  }));

  // 4. Instantiate agent with injected history, LLM, AND metadata (as inputs)
  // "Code Wins" - model, tools, instructions come from AgentClass
  // Metadata from DB handles the lazy resolution of behavior
  const agent = new AgentClass({
    llm,
    messages: history,
    inputs: sessionRecord.metadata as I
  }) as T;

  return new AgentSession<I, T>(
    prisma,
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
function getTable(prisma: GenericPrismaClient, tableName: string): PrismaModel {
  const p = prisma as unknown as Record<string, PrismaModel>;

  // 1. Direct match
  const table = p[tableName];
  if (table) return table;

  // 2. Case-insensitive match
  const keys = Object.keys(prisma).filter((k) => !k.startsWith("$") && !k.startsWith("_"));
  const match = keys.find((k) => k.toLowerCase() === tableName.toLowerCase());

  if (match && p[match]) return p[match];

  throw new Error(
    `[@node-llm/orm] Prisma table "${tableName}" not found. Available tables: ${keys.join(", ")}`
  );
}
