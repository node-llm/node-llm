/**
 * @node-llm/orm/prisma
 *
 * Prisma adapter for NodeLLM ORM.
 * Provides automatic persistence of chats, messages, tool calls, and API requests.
 *
 * @example Chat API (low-level)
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
 *
 * @example AgentSession API (recommended for agents)
 * ```typescript
 * import { Agent } from '@node-llm/core';
 * import { createAgentSession, loadAgentSession } from '@node-llm/orm/prisma';
 *
 * class SupportAgent extends Agent {
 *   static model = 'gpt-4.1';
 *   static instructions = 'You are a helpful support agent.';
 * }
 *
 * // Create new session
 * const session = await createAgentSession(prisma, llm, SupportAgent, {
 *   metadata: { userId: 'user_123' }
 * });
 * await session.ask('Hello!');
 *
 * // Resume later (Code Wins - model/tools from class, history from DB)
 * const session = await loadAgentSession(prisma, llm, SupportAgent, sessionId);
 * await session.ask('Continue our conversation');
 * ```
 */

// Chat API
export { Chat, createChat, loadChat } from "./Chat.js";
export type { ChatRecord, MessageRecord, ChatOptions } from "./Chat.js";

// AgentSession API
export { AgentSession, createAgentSession, loadAgentSession } from "./AgentSession.js";
export type {
  AgentSessionRecord,
  CreateAgentSessionOptions,
  LoadAgentSessionOptions,
  TableNames // Export from AgentSession which includes agentSession key
} from "./AgentSession.js";
