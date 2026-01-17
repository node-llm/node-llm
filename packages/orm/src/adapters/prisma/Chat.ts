/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import type { NodeLLMCore } from "@node-llm/core";

export interface ChatRecord {
  id: string;
  model?: string | null;
  provider?: string | null;
  instructions?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: string;
  chatId: string;
  role: string;
  content?: string | null;
  contentRaw?: string | null;
  reasoning?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  modelId?: string | null;
  provider?: string | null;
  createdAt: Date;
}

export interface ChatOptions {
  model?: string;
  provider?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

/**
 * Chat - The core ORM model for persisting LLM conversations.
 *
 * Integrates with NodeLLM to automatically save:
 * - User and assistant messages
 * - Tool calls and results
 * - API request metrics
 *
 * @example
 * ```typescript
 * import { createChat } from '@node-llm/orm/prisma';
 * import { prisma } from './db';
 * import { llm } from './llm';
 *
 * const chat = await createChat(prisma, llm, {
 *   model: 'gpt-4',
 *   instructions: 'You are a helpful assistant.'
 * });
 *
 * const response = await chat.ask('Hello!');
 * console.log(response.content);
 * ```
 */
export class Chat {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly llm: NodeLLMCore,
    public readonly record: ChatRecord
  ) {}

  get id() {
    return this.record.id;
  }

  /**
   * Send a message and persist the conversation.
   */
  async ask(input: string): Promise<MessageRecord> {
    // Create user message
    const userMessage = await (this.prisma as any).message.create({
      data: {
        chatId: this.id,
        role: "user",
        content: input
      }
    });

    // Create placeholder assistant message
    const assistantMessage = await (this.prisma as any).message.create({
      data: {
        chatId: this.id,
        role: "assistant",
        content: null
      }
    });

    try {
      // Fetch conversation history
      const historyRecords = await (this.prisma as any).message.findMany({
        where: {
          chatId: this.id,
          id: { notIn: [userMessage.id, assistantMessage.id] }
        },
        orderBy: { createdAt: "asc" }
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      // Create LLM chat instance
      const provider = this.record.provider;
      const model = this.record.model;

      const llmInstance = provider ? this.llm.withProvider(provider) : this.llm;

      const chat = llmInstance.chat(model || undefined, {
        messages: history
      });

      if (this.record.instructions) {
        chat.system(this.record.instructions);
      }

      // Attach persistence hooks
      chat
        .onToolCallEnd(async (call: any, result: any) => {
          await (this.prisma as any).toolCall.create({
            data: {
              messageId: assistantMessage.id,
              toolCallId: call.id || "unknown",
              name: call.function.name,
              arguments:
                typeof call.function.arguments === "string"
                  ? call.function.arguments
                  : JSON.stringify(call.function.arguments),
              result: typeof result === "string" ? result : JSON.stringify(result)
            }
          });
        })
        .afterResponse(async (resp: any) => {
          await (this.prisma as any).request.create({
            data: {
              chatId: this.id,
              messageId: assistantMessage.id,
              provider: resp.provider || this.record.provider || "unknown",
              model: resp.model || this.record.model || "unknown",
              statusCode: 200,
              duration: resp.latency || 0,
              inputTokens: resp.usage?.input_tokens || 0,
              outputTokens: resp.usage?.output_tokens || 0,
              cost: resp.usage?.cost || 0
            }
          });
          return resp;
        });

      // Execute LLM request
      const response = await chat.ask(input);

      // Update assistant message with response
      return await (this.prisma as any).message.update({
        where: { id: assistantMessage.id },
        data: {
          content: response.content,
          contentRaw: JSON.stringify(response.meta),
          reasoning: response.reasoning,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          modelId: response.model,
          provider: response.provider
        }
      });
    } catch (err) {
      // Cleanup on failure
      await (this.prisma as any).message.delete({
        where: { id: assistantMessage.id }
      });
      throw err;
    }
  }

  /**
   * Stream a response and persist the conversation.
   * Yields tokens in real-time, then saves the complete message.
   *
   * @example
   * ```typescript
   * for await (const chunk of chat.askStream('Tell me a story')) {
   *   process.stdout.write(chunk);
   * }
   * ```
   */
  async *askStream(input: string): AsyncGenerator<string, MessageRecord, undefined> {
    // Create user message
    const userMessage = await (this.prisma as any).message.create({
      data: {
        chatId: this.id,
        role: "user",
        content: input
      }
    });

    // Create placeholder assistant message
    const assistantMessage = await (this.prisma as any).message.create({
      data: {
        chatId: this.id,
        role: "assistant",
        content: null
      }
    });

    try {
      // Fetch conversation history
      const historyRecords = await (this.prisma as any).message.findMany({
        where: {
          chatId: this.id,
          id: { notIn: [userMessage.id, assistantMessage.id] }
        },
        orderBy: { createdAt: "asc" }
      });

      const history = historyRecords.map((m: any) => ({
        role: m.role,
        content: m.content || ""
      }));

      // Create LLM chat instance
      const provider = this.record.provider;
      const model = this.record.model;

      const llmInstance = provider ? this.llm.withProvider(provider) : this.llm;

      const chat = llmInstance.chat(model || undefined, {
        messages: history
      });

      if (this.record.instructions) {
        chat.system(this.record.instructions);
      }

      // Attach persistence hooks
      chat
        .onToolCallEnd(async (call: any, result: any) => {
          await (this.prisma as any).toolCall.create({
            data: {
              messageId: assistantMessage.id,
              toolCallId: call.id || "unknown",
              name: call.function.name,
              arguments:
                typeof call.function.arguments === "string"
                  ? call.function.arguments
                  : JSON.stringify(call.function.arguments),
              result: typeof result === "string" ? result : JSON.stringify(result)
            }
          });
        })
        .afterResponse(async (resp: any) => {
          await (this.prisma as any).request.create({
            data: {
              chatId: this.id,
              messageId: assistantMessage.id,
              provider: resp.provider || this.record.provider || "unknown",
              model: resp.model || this.record.model || "unknown",
              statusCode: 200,
              duration: resp.latency || 0,
              inputTokens: resp.usage?.input_tokens || 0,
              outputTokens: resp.usage?.output_tokens || 0,
              cost: resp.usage?.cost || 0
            }
          });
          return resp;
        });

      // Stream the response
      let fullContent = "";
      let metadata: any = {};

      for await (const chunk of chat.stream(input)) {
        if (chunk.content) {
          fullContent += chunk.content;
          yield chunk.content;
        }

        // Capture metadata from final chunk
        if (chunk.meta) {
          metadata = chunk.meta;
        }
      }

      // Update assistant message with complete response
      const updatedMessage = await (this.prisma as any).message.update({
        where: { id: assistantMessage.id },
        data: {
          content: fullContent,
          contentRaw: JSON.stringify(metadata),
          reasoning: metadata.reasoning,
          inputTokens: metadata.inputTokens,
          outputTokens: metadata.outputTokens,
          modelId: metadata.model,
          provider: metadata.provider
        }
      });

      return updatedMessage;
    } catch (err) {
      // Cleanup on failure
      await (this.prisma as any).message.delete({
        where: { id: assistantMessage.id }
      });
      throw err;
    }
  }

  /**
   * Get all messages in this chat.
   */
  async messages(): Promise<MessageRecord[]> {
    return (this.prisma as any).message.findMany({
      where: { chatId: this.id },
      orderBy: { createdAt: "asc" }
    });
  }
}

/**
 * Create a new chat session.
 */
export async function createChat(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  options: ChatOptions = {}
): Promise<Chat> {
  const record = await (prisma as any).chat.create({
    data: {
      model: options.model,
      provider: options.provider,
      instructions: options.instructions,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null
    }
  });

  return new Chat(prisma, llm, record);
}

/**
 * Load an existing chat session.
 */
export async function loadChat(
  prisma: PrismaClient,
  llm: NodeLLMCore,
  chatId: string
): Promise<Chat | null> {
  const record = await (prisma as any).chat.findUnique({
    where: { id: chatId }
  });

  if (!record) return null;
  return new Chat(prisma, llm, record);
}
