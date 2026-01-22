-- AlterTable: Add support for Extended Thinking (Claude 3.7 / OpenAI o1)
-- This migration adds the required columns to AssistantMessage and AssistantToolCall 
-- to support persisting thinking text and cryptographic signatures.

-- AlterTable
ALTER TABLE "AssistantMessage" ADD COLUMN     "thinkingSignature" TEXT,
ADD COLUMN     "thinkingText" TEXT,
ADD COLUMN     "thinkingTokens" INTEGER;

-- AlterTable
ALTER TABLE "AssistantToolCall" ADD COLUMN     "thoughtSignature" TEXT;
