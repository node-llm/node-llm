-- Migration: Add correctionRounds to LlmRequest
-- Added on: 2026-03-28

-- AlterTable
ALTER TABLE "LlmRequest" ADD COLUMN "correctionRounds" INTEGER;
