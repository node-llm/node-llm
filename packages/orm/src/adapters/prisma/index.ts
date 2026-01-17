/**
 * @node-llm/orm/prisma
 *
 * Prisma adapter for NodeLLM ORM.
 * Provides automatic persistence of chats, messages, tool calls, and API requests.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { createLLM } from '@node-llm/core';
 * import { createChat } from '@node-llm/orm/prisma';
 *
 * const prisma = new PrismaClient();
 * const llm = createLLM({ provider: 'openai' });
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

export { Chat, createChat, loadChat } from "./Chat.js";
export type { ChatRecord, MessageRecord, ChatOptions, TableNames } from "./Chat.js";
