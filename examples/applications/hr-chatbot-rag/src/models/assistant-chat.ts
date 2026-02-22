/**
 * HR Chatbot Assistant using @node-llm/orm
 * 
 * This module provides factory functions that use @node-llm/orm with custom table names
 * to maintain backward compatibility with existing AssistantChat tables.
 */

import { prisma } from "@/lib/db";
import { llm } from "@/lib/node-llm";
import { 
  createAgentSession, 
  loadAgentSession, 
  type TableNames, 
  type AgentSession 
} from "@node-llm/orm/prisma";
import { hrChatbotMiddlewares } from "@/lib/middlewares";
import { HRAssistant, type HRAssistantInputs } from "@/assistants/hr-policy";

const TABLE_NAMES: TableNames = {
  agentSession: "assistantAgentSession",
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
    userName?: string;
    model?: string;
    provider?: string;
    instructions?: string;
    maxToolCalls?: number;
    debug?: boolean;
  } = {}): Promise<AgentSession<HRAssistantInputs, HRAssistant>> {
    return createAgentSession(prisma, llm, HRAssistant, {
      metadata: { userName: options.userName },
      debug: options.debug ?? true,
      tableNames: TABLE_NAMES,
      model: options.model,
      provider: options.provider,
      instructions: options.instructions,
      maxToolCalls: options.maxToolCalls
    });
  },

  /**
   * Load an existing chat session
   */
  async load(sessionId: string): Promise<AgentSession<HRAssistantInputs, HRAssistant> | null> {
    return loadAgentSession(prisma, llm, HRAssistant, sessionId, {
      tableNames: TABLE_NAMES,
      debug: true
    });
  },
};

// Export the session type for use in other modules
export type { AgentSession as Chat };
