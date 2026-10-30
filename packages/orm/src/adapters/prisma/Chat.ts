/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodeLLMCore, ChatChunk, AskOptions, Usage } from "@node-llm/core";
import { BaseChat, type ChatRecord, type ChatOptions } from "../../BaseChat.js";
import type { ChatStore } from "../../Store.js";
import { toStore } from "./PrismaStore.js";

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
 * A chat whose messages, tool calls and requests are recorded in a store: a Prisma client's
 * database by default, or any ChatStore.
 */
export class Chat extends BaseChat {
  private store: ChatStore;
  private persistenceConfig: Required<NonNullable<ChatOptions["persistence"]>>;

  constructor(
    prismaOrStore: unknown,
    private llm: NodeLLMCore,
    record: ChatRecord,
    options: ChatOptions = {},
    tableNames: TableNames = {}
  ) {
    super(record, options);
    this.store = toStore(prismaOrStore, tableNames);

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

    // `schema` needs core's own normalization (raw Zod schema -> Schema
    // instance), so it's applied via withSchema() below rather than spread
    // as a raw ChatOptions field.
    const { schema, ...chatOptions } = this.localOptions;

    const coreChat = llmInstance.chat(model || undefined, {
      messages: history,
      ...chatOptions,
      middlewares: this.customMiddlewares
    }) as any;

    // Register tools
    if (this.customTools.length > 0) {
      coreChat.withTools(this.customTools);
    }

    if (schema) {
      coreChat.withSchema(schema);
    }

    // --- Persistence Hooks ---

    coreChat.onToolCallStart(async (call: any) => {
      // Only persist if toolCalls persistence is enabled
      if (this.persistenceConfig.toolCalls) {
        await this.store.createToolCall({
          messageId: assistantMessageId,
          toolCallId: call.id,
          name: call.function?.name || "unknown",
          arguments: JSON.stringify(call.function?.arguments || {}),
          thought: (call as any).thought || null,
          thoughtSignature: (call as any).thought_signature || null
        });
      }

      // User hooks
      for (const h of this.userHooks.onToolCallStart) await h(call);
    });

    coreChat.onToolCallEnd(async (call: any, result: any) => {
      // Only persist if toolCalls persistence is enabled
      if (this.persistenceConfig.toolCalls) {
        const resString = typeof result === "string" ? result : JSON.stringify(result);

        await this.store.finishToolCall(assistantMessageId, call.id, {
          result: resString,
          thought: (call as any).thought || null
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
        await this.store.createRequest({
          chatId: this.id,
          messageId: assistantMessageId,
          provider: finalResp.provider || provider || "unknown",
          model: finalResp.model || model || "unknown",
          statusCode: 200,
          duration: finalResp.latency || 0,
          inputTokens: finalResp.usage?.input_tokens || 0,
          outputTokens: finalResp.usage?.output_tokens || 0,
          cost: finalResp.usage?.cost || 0
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

    if (this.userHooks.onToolCallError.length > 0) {
      coreChat.onToolCallError(async (call: any, error: Error) => {
        // First handler to return a directive (STOP/CONTINUE/RETRY) wins,
        // but every handler still runs so all of them get to observe it.
        let directive: any;
        for (const h of this.userHooks.onToolCallError) {
          const value = await h(call, error);
          if (value !== undefined && directive === undefined) {
            directive = value;
          }
        }
        return directive;
      });
    }

    if (this.userHooks.onConfirmToolCall.length > 0) {
      coreChat.onConfirmToolCall(async (call: any) => {
        // Every registered handler must approve for the call to proceed.
        for (const h of this.userHooks.onConfirmToolCall) {
          const approved = await h(call);
          if (approved === false) return false;
        }
        return true;
      });
    }

    return coreChat;
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(message: string, options: AskOptions = {}): Promise<MessageRecord> {
    const userMessage = await this.store.createMessage({
      chatId: this.id,
      role: "user",
      content: message
    });

    const assistantMessage = await this.store.createMessage({
      chatId: this.id,
      role: "assistant",
      content: null
    });

    try {
      const historyRecords = await this.store.listMessages(this.id, {
        excludeIds: [userMessage.id, assistantMessage.id]
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      const coreChat = await this.prepareCoreChat(history, assistantMessage!.id);
      const response = await coreChat.ask(message, options);

      return (await this.store.updateMessage(assistantMessage.id, {
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
    } catch (error) {
      // Delete the empty assistant message, but keep the user message
      // so there's a record of what was asked (useful for debugging)
      await this.store.deleteMessage(assistantMessage.id);
      throw error;
    }
  }

  /**
   * Stream a response and persist the conversation.
   * Yields ChatChunk objects for full visibility of thinking, content, and tools.
   */
  async *askStream(
    message: string,
    options: AskOptions = {}
  ): AsyncGenerator<ChatChunk, MessageRecord, undefined> {
    const userMessage = await this.store.createMessage({
      chatId: this.id,
      role: "user",
      content: message
    });

    const assistantMessage = await this.store.createMessage({
      chatId: this.id,
      role: "assistant",
      content: null
    });

    try {
      const historyRecords = await this.store.listMessages(this.id, {
        excludeIds: [userMessage.id, assistantMessage.id]
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      const coreChat = await this.prepareCoreChat(history, assistantMessage!.id);
      const stream = coreChat.stream(message, options);

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

      return (await this.store.updateMessage(assistantMessage.id, {
        content: fullContent,
        contentRaw: JSON.stringify(metadata),
        inputTokens: metadata.input_tokens || 0,
        outputTokens: metadata.output_tokens || 0,
        thinkingText: metadata.thinking?.text || null,
        thinkingSignature: metadata.thinking?.signature || null,
        thinkingTokens: metadata.thinking?.tokens || null,
        modelId: this.localOptions.model || this.record.model || null,
        provider: this.localOptions.provider || this.record.provider || null
      })) as MessageRecord;
    } catch (error) {
      // Delete the empty assistant message, but keep the user message
      // so there's a record of what was asked (useful for debugging)
      await this.store.deleteMessage(assistantMessage.id);
      throw error;
    }
  }

  /**
   * Get all messages for this chat.
   */
  async messages(): Promise<MessageRecord[]> {
    return (await this.store.listMessages(this.id)) as MessageRecord[];
  }

  /**
   * Returns a usage summary for this chat session.
   */
  async stats(): Promise<Usage> {
    const totals = await this.store.requestTotals(this.id);

    return {
      input_tokens: totals.inputTokens,
      output_tokens: totals.outputTokens,
      total_tokens: totals.inputTokens + totals.outputTokens,
      cost: totals.cost
    };
  }
}

/**
 * Creates a new chat session, recorded through a Prisma client or any ChatStore.
 */
export async function createChat<T = Record<string, any>>(
  prismaOrStore: unknown,
  llm: NodeLLMCore,
  options: ChatOptions & { tableNames?: TableNames } & T = {} as any
): Promise<Chat> {
  const {
    model,
    provider,
    instructions,
    metadata,
    tableNames: _tableNames,
    debug: _debug,
    persistence: _persistence,
    middlewares: _middlewares,
    maxToolCalls: _maxToolCalls,
    thinking: _thinking,
    temperature: _temperature,
    maxTokens: _maxTokens,
    headers: _headers,
    requestTimeout: _requestTimeout,
    params: _params,
    ...extras
  } = options;

  const store = toStore(prismaOrStore, options.tableNames);
  if (options.debug) console.log(`[@node-llm/orm] createChat: store=${store.constructor.name}`);

  const record = await store.createChat({
    model,
    provider,
    instructions,
    metadata: metadata ?? null,
    ...(extras as any)
  });

  return new Chat(store, llm, record, options, options.tableNames);
}

/**
 * Loads an existing chat session from a Prisma client or any ChatStore.
 */
export async function loadChat(
  prismaOrStore: unknown,
  llm: NodeLLMCore,
  chatId: string,
  options: ChatOptions & { tableNames?: TableNames; debug?: boolean } = {}
): Promise<Chat | null> {
  const store = toStore(prismaOrStore, options.tableNames);
  if (options.debug) console.log(`[@node-llm/orm] loadChat: store=${store.constructor.name}`);

  const record = await store.findChat(chatId);
  if (!record) return null;

  return new Chat(store, llm, record, options, options.tableNames);
}
