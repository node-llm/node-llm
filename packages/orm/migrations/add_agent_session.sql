-- Migration: Add AgentSession support
-- Version: @node-llm/orm v0.5.0+
-- 
-- This migration adds the LlmAgentSession table for persistent agent conversations.
-- Run this if you're upgrading from a previous version of @node-llm/orm.
--
-- Usage:
--   1. Copy this file to your prisma/migrations/<timestamp>_add_agent_session/ folder
--   2. Run: npx prisma migrate resolve --applied <timestamp>_add_agent_session
--   Or simply run: npx prisma migrate dev --name add_agent_session

-- Create the AgentSession table
CREATE TABLE IF NOT EXISTS "LlmAgentSession" (
    "id" TEXT NOT NULL,
    "agentClass" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmAgentSession_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on chatId (1:1 with LlmChat)
CREATE UNIQUE INDEX IF NOT EXISTS "LlmAgentSession_chatId_key" ON "LlmAgentSession"("chatId");

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "LlmAgentSession_agentClass_idx" ON "LlmAgentSession"("agentClass");
CREATE INDEX IF NOT EXISTS "LlmAgentSession_createdAt_idx" ON "LlmAgentSession"("createdAt");

-- Add foreign key constraint (idempotent - skips if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'LlmAgentSession_chatId_fkey'
    ) THEN
        ALTER TABLE "LlmAgentSession" 
            ADD CONSTRAINT "LlmAgentSession_chatId_fkey" 
            FOREIGN KEY ("chatId") 
            REFERENCES "LlmChat"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
    END IF;
END $$;
