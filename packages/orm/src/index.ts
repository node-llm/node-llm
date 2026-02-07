/**
 * @node-llm/orm
 *
 * Database persistence layer for NodeLLM.
 * Automatically tracks chats, messages, tool calls, and API requests.
 *
 * ## Quick Start
 *
 * 1. Copy `schema.prisma` from this package into your project
 * 2. Run `npx prisma migrate dev`
 * 3. Use the ORM:
 *
 * ```typescript
 * import { createChat } from '@node-llm/orm/prisma';
 * import { prisma } from './db.js';
 * import { llm } from './llm.js';
 *
 * const chat = await createChat(prisma, llm, {
 *   model: 'gpt-4',
 *   instructions: 'You are a helpful assistant.'
 * });
 *
 * await chat.ask('Hello!');
 * ```
 *
 * ## Agent Sessions (Recommended for Agents)
 *
 * ```typescript
 * import { Agent } from '@node-llm/core';
 * import { createAgentSession, loadAgentSession } from '@node-llm/orm/prisma';
 *
 * class SupportAgent extends Agent {
 *   static model = 'gpt-4.1';
 *   static instructions = 'You are a helpful support agent.';
 * }
 *
 * // Create and persist
 * const session = await createAgentSession(prisma, llm, SupportAgent);
 * await session.ask('Hello!');
 *
 * // Resume later (Code Wins - model/tools from class, history from DB)
 * const session = await loadAgentSession(prisma, llm, SupportAgent, sessionId);
 * ```
 *
 * ## Adapters
 *
 * - `@node-llm/orm/prisma` - Prisma adapter (recommended)
 *
 * ## Schema
 *
 * The ORM tracks five core entities:
 * - **AgentSession** - Links Agent class to persistent Chat (v0.5.0+)
 * - **Chat** - Session container (model, provider, instructions)
 * - **Message** - User/Assistant conversation history
 * - **ToolCall** - Tool executions (name, arguments, results)
 * - **Request** - API call metrics (tokens, latency, cost)
 */

// Re-export Prisma adapter as default
export * from "./adapters/prisma/index.js";
