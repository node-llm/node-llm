-- Migration: Add cachedTokens to LlmRequest
-- Added on: 2026-11-03

-- AlterTable
ALTER TABLE "LlmRequest" ADD COLUMN IF NOT EXISTS "cachedTokens" INTEGER;
