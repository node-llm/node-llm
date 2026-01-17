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
 * ## Adapters
 *
 * - `@node-llm/orm/prisma` - Prisma adapter (recommended)
 *
 * ## Schema
 *
 * The ORM tracks four core entities:
 * - **Chat** - Session container (model, provider, instructions)
 * - **Message** - User/Assistant conversation history
 * - **ToolCall** - Tool executions (name, arguments, results)
 * - **Request** - API call metrics (tokens, latency, cost)
 */

// Re-export Prisma adapter as default
export * from "./adapters/prisma/index.js";
