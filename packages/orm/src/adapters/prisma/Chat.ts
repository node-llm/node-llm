/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import type { NodeLLMCore, ChatChunk, AskOptions, Usage } from "@node-llm/core";
import { BaseChat, type ChatRecord, type ChatOptions } from "../../BaseChat.js";

export { type ChatRecord, type ChatOptions };

export interface MessageRecord {
  id: string;
  chatId: string;
  role: string;
  content: string | null;
  contentRaw: string | null;
  reasoning: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  thinkingText: string | null;
  thinkingSignature: string | null;
  thinkingTokens: number | null;
  modelId: string | null;
  provider: string | null;
  createdAt: Date;
}

export interface TableNames {
  chat?: string;
  message?: string;
  toolCall?: string;
  request?: string;
}

/**
 * Prisma-based Chat Implementation.
 */
export class Chat extends BaseChat {
  private tables: Required<TableNames>;
  private persistenceConfig: Required<NonNullable<ChatOptions["persistence"]>>;

  constructor(
    private prisma: PrismaClient,
    private llm: NodeLLMCore,
    record: ChatRecord,
    options: ChatOptions = {},
    tableNames: TableNames = {}
  ) {
    super(record, options);
    this.tables = {
      chat: tableNames.chat || "llmChat",
      message: tableNames.message || "llmMessage",
      toolCall: tableNames.toolCall || "llmToolCall",
      request: tableNames.request || "llmRequest"
    };

    this.persistenceConfig = {
      toolCalls: options.persistence?.toolCalls ?? true,
      requests: options.persistence?.requests ?? true
    };
  }

  /**
   * Internal prep for core Chat instance with persistence hooks.
   */
  private async prepareCoreChat(history: any[] = [], assistantMessageId: string) {
    const provider = this.localOptions.provider || this.record.provider;
    const model = this.localOptions.model || this.record.model;

    const llmInstance = provider ? this.llm.withProvider(provider as string) : this.llm;

    const coreChat = llmInstance.chat(model || undefined, {
      messages: history,
      ...this.localOptions
    }) as any;

    // Register tools
    if (this.customTools.length > 0) {
      coreChat.withTools(this.customTools);
    }

    // --- Persistence Hooks ---

    coreChat.onToolCallStart(async (call: any) => {
      // Only persist if toolCalls persistence is enabled
      if (this.persistenceConfig.toolCalls) {
        const toolCallModel = this.tables.toolCall;
        await (this.prisma as any)[toolCallModel].create({
          data: {
            messageId: assistantMessageId,
            toolCallId: call.id,
            name: call.function?.name || "unknown",
            arguments: JSON.stringify(call.function?.arguments || {}),
            thought: (call as any).thought || null,
            thoughtSignature: (call as any).thought_signature || null
          }
        });
      }

      // User hooks
      for (const h of this.userHooks.onToolCallStart) await h(call);
    });

    coreChat.onToolCallEnd(async (call: any, result: any) => {
      // Only persist if toolCalls persistence is enabled
      if (this.persistenceConfig.toolCalls) {
        const toolCallModel = this.tables.toolCall;
        const resString = typeof result === "string" ? result : JSON.stringify(result);

        await (this.prisma as any)[toolCallModel].update({
          where: { messageId_toolCallId: { messageId: assistantMessageId, toolCallId: call.id } },
          data: {
            result: resString,
            thought: (call as any).thought || null
          }
        });
      }

      // User hooks
      for (const h of this.userHooks.onToolCallEnd) await h(call, result);
    });

    coreChat.afterResponse(async (finalResp: any) => {
      this.log(
        `Internal afterResponse triggered. Calling ${this.userHooks.afterResponse.length} user hooks.`
      );

      // User hooks
      for (const h of this.userHooks.afterResponse) {
        const modified = await h(finalResp);
        if (modified) finalResp = modified;
      }

      // Only persist if requests persistence is enabled
      if (this.persistenceConfig.requests) {
        const modelName = this.tables.request;
        await (this.prisma as any)[modelName].create({
          data: {
            chatId: this.id,
            messageId: assistantMessageId,
            provider: finalResp.provider || provider || "unknown",
            model: finalResp.model || model || "unknown",
            statusCode: 200,
            duration: finalResp.latency || 0,
            inputTokens: finalResp.usage?.input_tokens || 0,
            outputTokens: finalResp.usage?.output_tokens || 0,
            cost: finalResp.usage?.cost || 0
          }
        });
      }

      return finalResp;
    });

    // Other core hooks
    if (this.userHooks.onNewMessage.length > 0) {
      coreChat.onNewMessage(async () => {
        for (const h of this.userHooks.onNewMessage) await h();
      });
    }

    if (this.userHooks.onEndMessage.length > 0) {
      coreChat.onEndMessage(async (msg: any) => {
        for (const h of this.userHooks.onEndMessage) await h(msg);
      });
    }

    if (this.userHooks.onBeforeRequest.length > 0) {
      coreChat.beforeRequest(async (msgs: any) => {
        let current = msgs;
        for (const h of this.userHooks.onBeforeRequest) {
          const mod = await h(current);
          if (mod) current = mod;
        }
        return current;
      });
    }

    return coreChat;
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(input: string, options: AskOptions = {}): Promise<MessageRecord> {
    const messageModel = this.tables.message;
    const userMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.id, role: "user", content: input }
    });

    const assistantMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.id, role: "assistant", content: null }
    });

    try {
      const historyRecords = await (this.prisma as any)[messageModel].findMany({
        where: { chatId: this.id, id: { notIn: [userMessage!.id, assistantMessage!.id] } },
        orderBy: { createdAt: "asc" }
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      const coreChat = await this.prepareCoreChat(history, assistantMessage!.id);
      const response = await coreChat.ask(input, options);

      return await (this.prisma as any)[messageModel].update({
        where: { id: assistantMessage!.id },
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
      // Delete the empty assistant message, but keep the user message
      // so there's a record of what was asked (useful for debugging)
      await (this.prisma as any)[messageModel].delete({ where: { id: assistantMessage!.id } });
      throw error;
    }
  }

  /**
   * Stream a response and persist the conversation.
   * Yields ChatChunk objects for full visibility of thinking, content, and tools.
   */
  async *askStream(
    input: string,
    options: AskOptions = {}
  ): AsyncGenerator<ChatChunk, MessageRecord, undefined> {
    const messageModel = this.tables.message;
    const userMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.id, role: "user", content: input }
    });

    const assistantMessage = await (this.prisma as any)[messageModel].create({
      data: { chatId: this.id, role: "assistant", content: null }
    });

    try {
      const historyRecords = await (this.prisma as any)[messageModel].findMany({
        where: { chatId: this.id, id: { notIn: [userMessage!.id, assistantMessage!.id] } },
        orderBy: { createdAt: "asc" }
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      const coreChat = await this.prepareCoreChat(history, assistantMessage!.id);
      const stream = coreChat.stream(input, options);

      let fullContent = "";
      let metadata: any = {};

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
        }

        // Yield the full chunk to the caller
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
        where: { id: assistantMessage!.id },
        data: {
          content: fullContent,
          contentRaw: JSON.stringify(metadata),
          inputTokens: metadata.input_tokens || 0,
          outputTokens: metadata.output_tokens || 0,
          thinkingText: metadata.thinking?.text || null,
          thinkingSignature: metadata.thinking?.signature || null,
          thinkingTokens: metadata.thinking?.tokens || null,
          modelId: this.localOptions.model || this.record.model || null,
          provider: this.localOptions.provider || this.record.provider || null
        }
      });
    } catch (error) {
      // Delete the empty assistant message, but keep the user message
      // so there's a record of what was asked (useful for debugging)
      await (this.prisma as any)[messageModel].delete({ where: { id: assistantMessage!.id } });
      throw error;
    }
  }

  /**
   * Get all messages for this chat.
   */
  async messages(): Promise<MessageRecord[]> {
    const messageModel = this.tables.message;
    return await (this.prisma as any)[messageModel].findMany({
      where: { chatId: this.id },
      orderBy: { createdAt: "asc" }
    });
  }

  /**
   * Returns a usage summary for this chat session.
   */
  async stats(): Promise<Usage> {
    const requestModel = this.tables.request;
    const aggregate = await (this.prisma as any)[requestModel].aggregate({
      where: { chatId: this.id },
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
}

/**
 * Convenience method to create a new chat session.
 */
export async function createChat<T = Record<string, any>>(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  options: ChatOptions & { tableNames?: TableNames } & T = {} as any
): Promise<Chat> {
  const chatTable = options.tableNames?.chat || "llmChat";

  // Extract known options so we don't double-pass them or pass them incorrectly
  const {
    model,
    provider,
    instructions,
    metadata,
    tableNames: _tableNames,
    debug: _debug,
    persistence: _persistence,
    ...extras
  } = options;

  const record = await (prisma as any)[chatTable].create({
    data: {
      model,
      provider,
      instructions,
      metadata: metadata ?? null,
      ...extras
    }
  });

  return new Chat(prisma, llm, record, options, options.tableNames);
}

/**
 * Convenience method to load an existing chat session.
 */
export async function loadChat(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  chatId: string,
  options: ChatOptions & { tableNames?: TableNames } = {}
): Promise<Chat | null> {
  const chatTable = options.tableNames?.chat || "llmChat";
  const record = await (prisma as any)[chatTable].findUnique({
    where: { id: chatId }
  });

  if (!record) return null;
  return new Chat(prisma, llm, record, options, options.tableNames);
}
