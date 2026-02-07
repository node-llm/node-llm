/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import type { NodeLLMCore, ChatChunk, AskOptions, Usage, Message } from "@node-llm/core";
import { Agent, AgentConfig, ChatOptions } from "@node-llm/core";

/**
 * Database record for an agent session.
 */
export interface AgentSessionRecord {
  id: string;
  agentClass: string;
  chatId: string;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database record for a message (simplified for session use).
 */
export interface MessageRecord {
  id: string;
  chatId: string;
  role: string;
  content: string | null;
  createdAt: Date;
  thinkingText?: string | null;
  thinkingSignature?: string | null;
  thinkingTokens?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  modelId?: string | null;
  provider?: string | null;
}

/**
 * Options for creating an agent session.
 */
export interface CreateAgentSessionOptions {
  /** Session-level metadata (userId, ticketId, etc.) */
  metadata?: Record<string, any>;
  /** Custom table names */
  tableNames?: TableNames;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Options for loading an agent session.
 */
export interface LoadAgentSessionOptions {
  /** Custom table names */
  tableNames?: TableNames;
  /** Enable debug logging */
  debug?: boolean;
  /** Skip agent class validation (not recommended) */
  skipClassValidation?: boolean;
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

type AgentClass<T extends Agent = Agent> = (new (
  overrides?: Partial<AgentConfig & ChatOptions>
) => T) & {
  name: string;
  model?: string;
  instructions?: string;
  tools?: any[];
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
 *   metadata: { userId: 'user_123' }
 * });
 * await session.ask('Hello!');
 *
 * // Resume later
 * const session = await loadAgentSession(prisma, llm, SupportAgent, sessionId);
 * await session.ask('What were we discussing?');
 * ```
 */
export class AgentSession<T extends Agent = Agent> {
  private tables: Required<TableNames>;
  private agent: T;

  constructor(
    private prisma: PrismaClient,
    private llm: NodeLLMCore,
    private AgentClass: AgentClass<T>,
    public readonly record: AgentSessionRecord,
    private options: { tableNames?: TableNames; debug?: boolean } = {},
    history: Message[] = []
  ) {
    this.tables = {
      agentSession: options.tableNames?.agentSession || "llmAgentSession",
      chat: options.tableNames?.chat || "llmChat",
      message: options.tableNames?.message || "llmMessage",
      toolCall: options.tableNames?.toolCall || "llmToolCall",
      request: options.tableNames?.request || "llmRequest"
    };

    // Instantiate agent with injected history and LLM
    // "Code Wins" - model, tools, instructions come from AgentClass
    this.agent = new AgentClass({
      llm: this.llm,
      messages: history
    }) as T;
  }

  private log(...args: any[]) {
    if (this.options.debug) {
      console.log(`[@node-llm/orm:AgentSession]`, ...args);
    }
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
  get metadata(): Record<string, any> | null | undefined {
    return this.record.metadata;
  }

  /** Agent class name */
  get agentClass(): string {
    return this.record.agentClass;
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(input: string, options: AskOptions = {}): Promise<MessageRecord> {
    const messageModel = this.tables.message;

    // Persist user message
    const userMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.chatId, role: "user", content: input }
    });

    // Create placeholder for assistant message
    const assistantMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.chatId, role: "assistant", content: null }
    });

    try {
      // Get response from agent (uses code-defined config + injected history)
      const response = await this.agent.ask(input, options);

      // Update assistant message with response
      return await (this.prisma as any)[messageModel].update({
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
      await (this.prisma as any)[messageModel].delete({ where: { id: assistantMessage.id } });
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
    const messageModel = this.tables.message;

    // Persist user message
    await (this.prisma as any)[messageModel].create({
      data: { chatId: this.chatId, role: "user", content: input }
    });

    // Create placeholder for assistant message
    const assistantMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.chatId, role: "assistant", content: null }
    });

    try {
      const stream = this.agent.stream(input, options);

      let fullContent = "";
      let metadata: any = {};

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
        }

        yield chunk;

        if (chunk.usage) {
          metadata = { ...metadata, ...chunk.usage };
        }
        if (chunk.thinking) {
          metadata.thinking = { ...(metadata.thinking || {}), ...chunk.thinking };
          if (chunk.thinking.text) {
            metadata.thinking.text = (metadata.thinking.text || "") + chunk.thinking.text;
          }
        }
      }

      return await (this.prisma as any)[messageModel].update({
        where: { id: assistantMessage.id },
        data: {
          content: fullContent,
          contentRaw: JSON.stringify(metadata),
          inputTokens: metadata.input_tokens || 0,
          outputTokens: metadata.output_tokens || 0,
          thinkingText: metadata.thinking?.text || null,
          thinkingSignature: metadata.thinking?.signature || null,
          thinkingTokens: metadata.thinking?.tokens || null,
          modelId: this.agent.modelId || null,
          provider: null
        }
      });
    } catch (error) {
      await (this.prisma as any)[messageModel].delete({ where: { id: assistantMessage.id } });
      throw error;
    }
  }

  /**
   * Get all messages for this session.
   */
  async messages(): Promise<MessageRecord[]> {
    const messageModel = this.tables.message;
    return await (this.prisma as any)[messageModel].findMany({
      where: { chatId: this.chatId },
      orderBy: { createdAt: "asc" }
    });
  }

  /**
   * Get the conversation history from the agent.
   */
  get history() {
    return this.agent.history;
  }

  /**
   * Get aggregate usage stats.
   */
  get totalUsage(): Usage {
    return this.agent.totalUsage;
  }

  /**
   * Get the model being used (from code, not DB).
   */
  get modelId(): string {
    return this.agent.modelId;
  }
}

// --- Factory Functions ---

/**
 * Helper to find the correct table property in the prisma client.
 */
function getTable(prisma: any, tableName: string): any {
  if (prisma[tableName]) return prisma[tableName];

  const keys = Object.keys(prisma).filter((k) => !k.startsWith("$") && !k.startsWith("_"));
  const match = keys.find((k) => k.toLowerCase() === tableName.toLowerCase());

  if (match) return prisma[match];

  throw new Error(
    `[@node-llm/orm] Prisma table "${tableName}" not found. Available tables: ${keys.join(", ")}`
  );
}

/**
 * Create a new agent session with persistence.
 *
 * @example
 * ```typescript
 * const session = await createAgentSession(prisma, llm, SupportAgent, {
 *   metadata: { userId: 'user_123', ticketId: 'TKT-456' }
 * });
 *
 * await session.ask('Where is my order?');
 * console.log(session.id); // Save this to resume later
 * ```
 */
export async function createAgentSession<T extends Agent>(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  options: CreateAgentSessionOptions = {}
): Promise<AgentSession<T>> {
  const tables = {
    agentSession: options.tableNames?.agentSession || "llmAgentSession",
    chat: options.tableNames?.chat || "llmChat",
    message: options.tableNames?.message || "llmMessage"
  };

  if (options.debug) {
    console.log(`[@node-llm/orm] createAgentSession: agent=${AgentClass.name}`);
  }

  // 1. Create underlying LlmChat record
  const chatTable = getTable(prisma, tables.chat);
  const chatRecord = await chatTable.create({
    data: {
      model: AgentClass.model || null,
      provider: null,
      instructions: AgentClass.instructions || null,
      metadata: null // Runtime metadata goes in Chat, session context in AgentSession
    }
  });

  // 2. Create AgentSession record
  const sessionTable = getTable(prisma, tables.agentSession);
  const sessionRecord = await sessionTable.create({
    data: {
      agentClass: AgentClass.name,
      chatId: chatRecord.id,
      metadata: options.metadata ?? null
    }
  });

  // 3. Return wrapped session (no history for new sessions)
  return new AgentSession<T>(
    prisma,
    llm,
    AgentClass,
    sessionRecord,
    { tableNames: options.tableNames, debug: options.debug },
    []
  );
}

/**
 * Load an existing agent session by ID.
 *
 * Follows "Code Wins" sovereignty:
 * - Model, tools, instructions come from AgentClass (code)
 * - Message history comes from database
 *
 * @example
 * ```typescript
 * const session = await loadAgentSession(prisma, llm, SupportAgent, 'sess_abc123');
 * if (!session) {
 *   throw new Error('Session not found');
 * }
 * await session.ask('What were we discussing?');
 * ```
 */
export async function loadAgentSession<T extends Agent>(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  AgentClass: AgentClass<T>,
  sessionId: string,
  options: LoadAgentSessionOptions = {}
): Promise<AgentSession<T> | null> {
  const tables = {
    agentSession: options.tableNames?.agentSession || "llmAgentSession",
    chat: options.tableNames?.chat || "llmChat",
    message: options.tableNames?.message || "llmMessage"
  };

  if (options.debug) {
    console.log(
      `[@node-llm/orm] loadAgentSession: sessionId=${sessionId}, agent=${AgentClass.name}`
    );
  }

  // 1. Find session record
  const sessionTable = getTable(prisma, tables.agentSession);
  const sessionRecord = await sessionTable.findUnique({
    where: { id: sessionId }
  });

  if (!sessionRecord) {
    return null;
  }

  // 2. Validate agent class matches (safety check)
  if (!options.skipClassValidation && sessionRecord.agentClass !== AgentClass.name) {
    throw new Error(
      `[@node-llm/orm] Agent class mismatch: session was created with "${sessionRecord.agentClass}" ` +
        `but attempting to load with "${AgentClass.name}". ` +
        `Use skipClassValidation: true to override (not recommended).`
    );
  }

  // 3. Load message history from DB
  const messageTable = getTable(prisma, tables.message);
  const messageRecords = await messageTable.findMany({
    where: { chatId: sessionRecord.chatId },
    orderBy: { createdAt: "asc" }
  });

  // 4. Convert to Message format for agent
  const history: Message[] = messageRecords.map((m: any) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content || ""
  }));

  // 5. Return session with injected history
  // "Code Wins" - AgentClass defines model, tools, instructions
  return new AgentSession<T>(
    prisma,
    llm,
    AgentClass,
    sessionRecord,
    { tableNames: options.tableNames, debug: options.debug },
    history
  );
}
