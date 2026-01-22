-- AlterTable: Infrastructure update for Extended Thinking & Metadata JSONB
-- This migration adds thinking support columns and migrates metadata to native JSONB.

-- AlterTable
ALTER TABLE "AssistantChat" ALTER COLUMN "metadata" TYPE JSONB USING metadata::JSONB;

-- AlterTable
ALTER TABLE "AssistantMessage" 
ADD COLUMN "thinkingSignature" TEXT,
ADD COLUMN "thinkingText" TEXT,
ADD COLUMN "thinkingTokens" INTEGER;

-- AlterTable
ALTER TABLE "AssistantToolCall" 
ADD COLUMN "thoughtSignature" TEXT;
