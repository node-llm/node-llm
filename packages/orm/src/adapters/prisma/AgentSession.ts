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

type AgentClass<T extends Agent = Agent> = (new (
  overrides?: Partial<AgentConfig & ChatOptions>
) => T) & {
  name: string;
  model?: string;
  instructions?: string;
  tools?: unknown[];
};

/**
 * AgentSession - Wraps an Agent instance with persistence capabilities.
 *
 * Follows "Code Wins" sovereignty:
 * - Model, Tools, Instructions come from the Agent class (code)
 * - Message history comes from the database
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
export class AgentSession<T extends Agent = Agent> {
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
      llm
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
  get metadata(): Record<string, unknown> | null | undefined {
    return this.record.metadata;
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
   * Send a message and persist the conversation.
   */
  async ask(input: string, options: AskOptions = {}): Promise<MessageRecord> {
    const model = this.getModel<MessageRecord>(this.tableNames.message);

    // Persist user message
    await model.create({
      data: { chatId: this.chatId, role: "user", content: input }
    });

    // Create placeholder for assistant message
    const assistantMessage = await model.create({
      data: { chatId: this.chatId, role: "assistant", content: null }
    });

    this.currentMessageId = assistantMessage.id;

    try {
      // Get response from agent (uses code-defined config + injected history)
      const response = await this.agent.ask(input, options);

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
    input: string,
    options: AskOptions = {}
  ): AsyncGenerator<ChatChunk, MessageRecord, undefined> {
    const model = this.getModel<MessageRecord>(this.tableNames.message);

    // Persist user message
    await model.create({
      data: { chatId: this.chatId, role: "user", content: input }
    });

    // Create placeholder for assistant message
    const assistantMessage = await model.create({
      data: { chatId: this.chatId, role: "assistant", content: null }
    });

    this.currentMessageId = assistantMessage.id;

    try {
      const stream = this.agent.stream(input, options);

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
}

/**
 * Options for creating a new agent session.
 */
export interface CreateAgentSessionOptions {
  metadata?: Record<string, unknown>;
  tableNames?: TableNames;
  debug?: boolean;
}

/**
 * Creates a new agent session and its persistent chat record.
 */
export async function createAgentSession<T extends Agent>(
  prisma: any,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  options: CreateAgentSessionOptions = {}
): Promise<AgentSession<T>> {
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
      model: AgentClass.model || null,
      provider: null,
      instructions: AgentClass.instructions || null,
      metadata: null // Runtime metadata goes in Chat, session context in AgentSession
    }
  })) as unknown as { id: string };

  // 2. Create AgentSession record
  const sessionTable = getTable(prisma, tableNames.agentSession);
  const sessionRecord = (await sessionTable.create({
    data: {
      agentClass: AgentClass.name,
      chatId: chatRecord.id,
      metadata: options.metadata || null
    }
  })) as unknown as AgentSessionRecord;

  return new AgentSession(
    prisma,
    llm,
    AgentClass,
    sessionRecord,
    options.tableNames,
    undefined,
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
export async function loadAgentSession<T extends Agent>(
  prisma: any,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  sessionId: string,
  options: LoadAgentSessionOptions = {}
): Promise<AgentSession<T> | null> {
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

  // 4. Instantiate agent with injected history and LLM
  // "Code Wins" - model, tools, instructions come from AgentClass
  const agent = new AgentClass({
    llm,
    messages: history
  }) as T;

  return new AgentSession(
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
