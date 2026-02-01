/**
 * HR Chatbot Assistant using @node-llm/orm
 * 
 * This module provides factory functions that use @node-llm/orm with custom table names
 * to maintain backward compatibility with existing AssistantChat tables.
 */

import { prisma } from "@/lib/db";
import { llm } from "@/lib/node-llm";
import { createChat, loadChat, type TableNames, type Chat } from "@node-llm/orm/prisma";
import { hrChatbotMiddlewares } from "@/lib/middlewares";

// Map ORM table names to our existing schema
const TABLE_NAMES: TableNames = {
  chat: "assistantChat",
  message: "assistantMessage",
  toolCall: "assistantToolCall",
  request: "assistantRequest",
};

/**
 * AssistantChat namespace for creating and loading chat sessions
 */
export const AssistantChat = {
  /**
   * Create a new chat session
   */
  async create(options: {
    model?: string;
    provider?: string;
    instructions?: string;
    maxToolCalls?: number;
    metadata?: Record<string, any>;
    debug?: boolean;
  } = {}): Promise<Chat> {
    // Enable debug logging by default for better visibility during development
    // Include production middlewares for monitoring, auditing, and compliance
    const chatOptions = { 
      debug: true, 
      ...options, 
      tableNames: TABLE_NAMES,
      middlewares: hrChatbotMiddlewares
    };
    return createChat(prisma, llm, chatOptions);
  },

  /**
   * Load an existing chat session
   */
  async load(chatId: string): Promise<Chat | null> {
    return loadChat(prisma, llm, chatId, { 
      tableNames: TABLE_NAMES,
      middlewares: hrChatbotMiddlewares,
      maxToolCalls: 10, // Ensure budget is maintained on load
      debug: true
    });
  },
};

// Export the Chat type for use in other modules
export type { Chat };
