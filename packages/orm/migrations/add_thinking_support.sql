-- Migration: Add Extended Thinking support
-- Version: @node-llm/orm v0.2.0+
-- 
-- This migration adds columns for Extended Thinking (Claude 3.7+, DeepSeek R1).
-- Run this if you're upgrading from a previous version of @node-llm/orm.
--
-- Usage:
--   1. Copy this file to your prisma/migrations/<timestamp>_add_thinking_support/ folder
--   2. Run: npx prisma migrate resolve --applied <timestamp>_add_thinking_support
--   Or simply run: npx prisma migrate dev --name add_thinking_support
--
-- Note: Adjust table names if using custom names (e.g., AssistantMessage instead of LlmMessage)
-- Note: This migration is idempotent - safe to run multiple times.

-- AlterTable: Convert metadata to native JSONB (idempotent - skips if already JSONB)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LlmChat' AND column_name = 'metadata' AND data_type != 'jsonb'
    ) THEN
        ALTER TABLE "LlmChat" ALTER COLUMN "metadata" TYPE JSONB USING metadata::JSONB;
    END IF;
END $$;

-- AlterTable: Add thinking columns to Message
ALTER TABLE "LlmMessage" 
ADD COLUMN IF NOT EXISTS "thinkingText" TEXT,
ADD COLUMN IF NOT EXISTS "thinkingSignature" TEXT,
ADD COLUMN IF NOT EXISTS "thinkingTokens" INTEGER;

-- AlterTable: Add thought signature to ToolCall
ALTER TABLE "LlmToolCall" 
ADD COLUMN IF NOT EXISTS "thoughtSignature" TEXT;
