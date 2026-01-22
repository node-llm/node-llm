-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "AssistantChat" (
    "id" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "instructions" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "contentRaw" TEXT,
    "reasoning" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "thinkingText" TEXT,
    "thinkingSignature" TEXT,
    "thinkingTokens" INTEGER,
    "modelId" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantToolCall" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "toolCallId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arguments" TEXT NOT NULL,
    "thought" TEXT,
    "thoughtSignature" TEXT,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantRequest" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantToolCall_messageId_toolCallId_key" ON "AssistantToolCall"("messageId", "toolCallId");

-- CreateIndex
CREATE INDEX "DocumentChunk_createdAt_idx" ON "DocumentChunk"("createdAt");

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AssistantChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantToolCall" ADD CONSTRAINT "AssistantToolCall_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AssistantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AssistantChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantRequest" ADD CONSTRAINT "AssistantRequest_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AssistantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

