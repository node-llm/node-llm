/**
 * HR Agent Session - Persistent Agent Sessions for HR Chatbot
 * 
 * This module provides factory functions that wrap @node-llm/orm's AgentSession
 * with custom table names for backward compatibility with existing AssistantChat tables.
 * 
 * Follows the "Code Wins" pattern:
 * - Model, Tools, Instructions come from HRPolicyAgent class (code)
 * - Message history comes from database
 */

import { prisma } from "@/lib/db";
import { llm } from "@/lib/node-llm";
import { 
  AgentSession, 
  createAgentSession, 
  loadAgentSession,
  type TableNames 
} from "@node-llm/orm/prisma";
import { HRPolicyAgent } from "@/agents/hr-policy-agent";

// Map ORM table names to our existing schema
const TABLE_NAMES: TableNames = {
  agentSession: "assistantAgentSession",
  chat: "assistantChat",
  message: "assistantMessage",
  toolCall: "assistantToolCall",
  request: "assistantRequest",
};

export type HRSession = AgentSession<HRPolicyAgent>;

/**
 * HRAgentSession namespace for creating and loading agent sessions
 */
export const HRAgentSession = {
  /**
   * Create a new HR agent session
   */
  async create(options: {
    metadata?: Record<string, unknown>;
    debug?: boolean;
  } = {}): Promise<HRSession> {
    return createAgentSession(prisma, llm, HRPolicyAgent, {
      metadata: options.metadata,
      tableNames: TABLE_NAMES,
      debug: options.debug ?? true,
    });
  },

  /**
   * Load an existing HR agent session
   */
  async load(sessionId: string, options: {
    debug?: boolean;
  } = {}): Promise<HRSession | null> {
    return loadAgentSession(prisma, llm, HRPolicyAgent, sessionId, {
      tableNames: TABLE_NAMES,
      debug: options.debug ?? true,
    });
  },
};
