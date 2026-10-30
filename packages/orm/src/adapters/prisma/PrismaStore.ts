/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ChatStore,
  MessageUpdate,
  NewChat,
  NewRequest,
  NewToolCall,
  RequestTotals,
  StoredAgentSession,
  StoredChat,
  StoredMessage
} from "../../Store.js";
import { isChatStore } from "../../Store.js";

export interface TableNames {
  agentSession?: string;
  chat?: string;
  message?: string;
  toolCall?: string;
  request?: string;
}

/**
 * Keeps chats in a database through a Prisma client, in the tables of the reference schema or
 * the ones named in tableNames.
 */
export class PrismaStore implements ChatStore {
  private tables: Required<TableNames>;

  constructor(
    private prisma: any,
    tableNames: TableNames = {}
  ) {
    this.tables = {
      agentSession: tableNames.agentSession || "llmAgentSession",
      chat: tableNames.chat || "llmChat",
      message: tableNames.message || "llmMessage",
      toolCall: tableNames.toolCall || "llmToolCall",
      request: tableNames.request || "llmRequest"
    };
  }

  async createChat(chat: NewChat): Promise<StoredChat> {
    return await this.table("chat").create({ data: chat });
  }

  async findChat(id: string): Promise<StoredChat | null> {
    return await this.table("chat").findUnique({ where: { id } });
  }

  async deleteChat(id: string): Promise<void> {
    await this.table("chat").delete({ where: { id } });
  }

  async createMessage(message: {
    chatId: string;
    role: string;
    content: string | null;
  }): Promise<StoredMessage> {
    return await this.table("message").create({ data: message });
  }

  async updateMessage(id: string, changes: MessageUpdate): Promise<StoredMessage> {
    return await this.table("message").update({ where: { id }, data: changes });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.table("message").delete({ where: { id } });
  }

  async listMessages(
    chatId: string,
    options: { excludeIds?: string[] } = {}
  ): Promise<StoredMessage[]> {
    const where = options.excludeIds?.length
      ? { chatId, id: { notIn: options.excludeIds } }
      : { chatId };
    return await this.table("message").findMany({ where, orderBy: { createdAt: "asc" } });
  }

  async createToolCall(toolCall: NewToolCall): Promise<void> {
    await this.table("toolCall").create({ data: toolCall });
  }

  async finishToolCall(
    messageId: string,
    toolCallId: string,
    finished: { result: string; thought?: string | null }
  ): Promise<void> {
    await this.table("toolCall").update({
      where: { messageId_toolCallId: { messageId, toolCallId } },
      data: finished
    });
  }

  async createRequest(request: NewRequest): Promise<void> {
    await this.table("request").create({ data: request });
  }

  async requestTotals(chatId: string): Promise<RequestTotals> {
    const aggregate = await this.table("request").aggregate({
      where: { chatId },
      _sum: { inputTokens: true, outputTokens: true, cost: true }
    });
    return {
      inputTokens: Number(aggregate._sum.inputTokens || 0),
      outputTokens: Number(aggregate._sum.outputTokens || 0),
      cost: Number(aggregate._sum.cost || 0)
    };
  }

  async createAgentSession(session: {
    agentClass: string;
    chatId: string;
    metadata: Record<string, unknown> | null;
  }): Promise<StoredAgentSession> {
    return await this.table("agentSession").create({ data: session });
  }

  async findAgentSession(id: string): Promise<StoredAgentSession | null> {
    return await this.table("agentSession").findUnique({ where: { id } });
  }

  async updateAgentSession(
    id: string,
    changes: { metadata: Record<string, unknown> }
  ): Promise<void> {
    await this.table("agentSession").update({ where: { id }, data: changes });
  }

  /**
   * The Prisma model for a table. Prisma usually camelCases model names (AssistantChat becomes
   * assistantChat), but mapping can vary, so a case-insensitive match is accepted too.
   */
  private table(kind: keyof TableNames): any {
    const name = this.tables[kind];
    if (this.prisma[name]) return this.prisma[name];

    const keys = Object.keys(this.prisma).filter((k) => !k.startsWith("$") && !k.startsWith("_"));
    const match = keys.find((k) => k.toLowerCase() === name.toLowerCase());
    if (match) return this.prisma[match];

    throw new Error(
      `[@node-llm/orm] Prisma table "${name}" not found. Available tables: ${keys.join(", ")}`
    );
  }
}

/** A ChatStore as given, or a Prisma client wrapped in a PrismaStore. */
export function toStore(prismaOrStore: unknown, tableNames?: TableNames): ChatStore {
  return isChatStore(prismaOrStore) ? prismaOrStore : new PrismaStore(prismaOrStore, tableNames);
}
