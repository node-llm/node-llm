"use server";

/**
 * Agent-based Chat Actions
 * 
 * This module uses the new Agent + AgentSession pattern instead of the raw Chat API.
 * Benefits:
 * - "Code Wins" pattern: model, tools, instructions are defined in the HRPolicyAgent class
 * - No need to pass tools on each request - they're part of the agent definition
 * - Resume sessions with updated code (model upgrades, prompt fixes apply immediately)
 */

import { HRAgentSession, type HRSession } from "@/models/hr-agent-session";

/**
 * Send a message using the Agent pattern
 */
export async function sendMessageAgent(sessionId: string | null, message: string) {
  let session: HRSession;

  if (!sessionId) {
    session = await HRAgentSession.create({
      metadata: { source: "web-client" },
    });
  } else {
    const loadedSession = await HRAgentSession.load(sessionId);
    if (!loadedSession) {
      console.warn(`Session ${sessionId} not found, creating new.`);
      session = await HRAgentSession.create({
        metadata: { source: "web-client" },
      });
    } else {
      session = loadedSession;
    }
  }

  // Tools are already part of HRPolicyAgent - no need to attach them!
  const responseRecord = await session.ask(message);

  console.log(`[AgentSession] Session ${session.id}, Model: ${session.modelId}`);

  return {
    sessionId: session.id,
    chatId: session.chatId,
    message: responseRecord,
  };
}

/**
 * Helper to get or create an agent session
 */
async function getOrCreateSession(sessionId: string | null): Promise<HRSession> {
  if (!sessionId) {
    return HRAgentSession.create({ metadata: { source: "web-client" } });
  }

  const session = await HRAgentSession.load(sessionId);
  if (!session) {
    console.warn(`Session ${sessionId} not found, creating new.`);
    return HRAgentSession.create({ metadata: { source: "web-client" } });
  }

  return session;
}

/**
 * Stream a message using the Agent pattern
 */
export async function sendMessageAgentStream(
  sessionId: string | null,
  message: string
): Promise<ReadableStream<Uint8Array>> {
  const session = await getOrCreateSession(sessionId);
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Send session info first
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ 
              type: "session", 
              sessionId: session.id,
              chatId: session.chatId 
            }) + "\n"
          )
        );

        // Stream tokens - tools are already part of HRPolicyAgent
        for await (const chunk of session.askStream(message)) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "chunk", chunk }) + "\n")
          );
        }

        // Signal completion
        console.log(`[AgentSession Stream] Session ${session.id}, Usage:`, session.totalUsage);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            }) + "\n"
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}
