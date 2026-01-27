---
layout: default
title: Prisma Integration
parent: ORM & Persistence
nav_order: 1
permalink: /orm/prisma
---

# Prisma Integration
{: .no_toc }

NodeLLM + Prisma made simple. Persist chats, messages, and tool calls automatically.
{: .fs-6 .fw-300 }

**Added in v0.2.0**
{: .label .label-green }

1. TOC
{:toc}

---

## Understanding the Persistence Flow

Before diving into setup, it’s important to understand how NodeLLM handles message persistence. This design ensures that your database remains the source of truth, even during streaming or complex tool execution loops.

### How It Works

When calling `chat.ask("What is the capital of France?")`, the ORM adapter:

1.  **Creates a User Message** in your database with the input content.
2.  **Creates an Empty Assistant Message** immediately. This serves as a "placeholder" for streaming or pending responses.
3.  **Fetches History** automatically from the database to provide full context to the LLM.
4.  **Executes the Request** via the NodeLLM core:
    *   **On Tool Call Start**: Creates a record in the `ToolCall` table.
    *   **On Tool Call End**: Updates the `ToolCall` record with the result.
    *   **On Response**: Logs the full API metric (tokens, latency, cost) to the `Request` table.
5.  **Finalizes the Assistant Message**: Updates the previously created placeholder with the final content and usage metrics.

### Why This Design?

- **Streaming Optimized**: Creates the database record immediately so your UI can target a specific ID for real-time updates.
- **Audit Ready**: Captures partial tool execution data if a process crashes mid-loop.
- **Automated Cleanup**: If the API call fails or is aborted, the ORM automatically cleans up the message records to prevent orphaned "empty" messages.

---

## Setting Up Your Application

### 1. Schema Configuration

The fastest way to get started is to use the **NodeLLM ORM CLI**. Run this command in your project root to generate the required Prisma schema:

```bash
npx @node-llm/orm init
```

This will create a `prisma/schema.prisma` file (or provide instructions if one already exists) populated with the standard models.

Alternatively, you can manually copy the reference models below. You can customize the model names (e.g., using `AssistantChat` instead of `LlmChat`) using the [Custom Table Names](#custom-table-names) option.

```prisma
model LlmChat {
  id           String       @id @default(uuid())
  model        String?
  provider     String?
  instructions String?      
  metadata     Json?         // Use Json for metadata
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  messages     LlmMessage[]
  requests     LlmRequest[]
}

model LlmMessage {
  id                String        @id @default(uuid())
  chatId            String
  role              String        // user, assistant, system, tool
  content           String?
  contentRaw        String?       // JSON raw payload
  reasoning         String?       // Chain of thought (deprecated)
  thinkingText      String?       // Extended thinking text
  thinkingSignature String?       // Cryptographic signature
  thinkingTokens    Int?          // Tokens spent on thinking
  inputTokens       Int?
  outputTokens      Int?
  modelId           String?
  provider          String?
  createdAt         DateTime      @default(now())

  chat         LlmChat       @relation(fields: [chatId], references: [id], onDelete: Cascade)
  toolCalls    LlmToolCall[]
  requests     LlmRequest[]
}

model LlmToolCall {
  id               String     @id @default(uuid())
  messageId        String
  toolCallId       String     // ID from the provider
  name             String
  arguments        String     
  thought          String?    
  thoughtSignature String?    
  result           String?    
  createdAt        DateTime   @default(now())

  message      LlmMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId, toolCallId])
}

model LlmRequest {
  id           String      @id @default(uuid())
  chatId       String
  messageId    String?     
  provider     String
  model        String
  statusCode   Int
  duration     Int         // milliseconds
  inputTokens  Int
  outputTokens Int
  cost         Float?
  createdAt    DateTime    @default(now())

  chat         LlmChat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  message      LlmMessage? @relation(fields: [messageId], references: [id], onDelete: Cascade)
}
```

### 2. Database Migrations

For production-grade systems, always use **Prisma Migrate** instead of `db push`. This ensures you have a versioned history of changes and prevents accidental data loss.

See the [Database Migration Guide](./migrations.md) for detailed instructions.

### 2. Manual Setup

Initialize the adapter with your `PrismaClient` and `NodeLLMCore` instance.

```typescript
import { PrismaClient } from "@prisma/client";
import { createLLM } from "@node-llm/core";
import { createChat, loadChat } from "@node-llm/orm/prisma";

const prisma = new PrismaClient();
const llm = createLLM();
```

---

## Basic Chat Operations

The ORM Chat implementation provides a fluent API that mirrors the core NodeLLM experience.

### Creating and Loading Chats

```typescript
// Start a new session with reasoning enabled by default
const chat = await createChat(prisma, llm, {
  model: "claude-3-7-sonnet",
  instructions: "You are a helpful assistant.",
  thinking: { budget: 16000 }
});

// Load an existing session from DB (automatically rehydrates history)
const savedChat = await loadChat(prisma, llm, "chat-uuid-123");
```

### Asking Questions

When you use `.ask()`, the persistence flow runs automatically.

```typescript
// This saves the user message, calls the API, and persists the response
const messageRecord = await chat.ask("What is the capital of France?");

// You can also pass thinking configuration directly per request
const advancedResp = await chat.ask("Solve this logical puzzle", {
  thinking: { budget: 32000 }
});

console.log(messageRecord.content); // "The capital of France is Paris."
console.log(messageRecord.inputTokens); // 12
```

---

## Streaming Responses

For real-time user experiences, use `askStream()`. The assistant message record is "finalized" once the stream completes.

```typescript
for await (const chunk of chat.askStream("Tell me a long story")) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}

// History is now updated in the DB
const history = await chat.messages();
```

---

## Analytical Views (Insights)

The ORM is great at storing data, but querying it for usage insights (e.g., "How many tokens did this user spend?") can be complex. NodeLLM provides a built-in `stats()` method that aggregates conversation-level metrics efficiently using Prisma's `aggregate` features.

### Conversation Summary

```typescript
const chat = await loadChat(prisma, llm, "chat-uuid-123");
const stats = await chat.stats();

console.log(`Input Tokens: ${stats.input_tokens}`);
console.log(`Output Tokens: ${stats.output_tokens}`);
console.log(`Total Cost: $${stats.cost}`);
```

This method is significantly more efficient than fetching and summing all message records manually, as it performs the calculation directly inside the database.

---

## Advanced Usage

### Custom Table Names

If you are integrating with an existing database schema, you can map the ORM to your custom table names:

```typescript
const tableNames = {
  chat: "AssistantChat",
  message: "AssistantMessage",
  toolCall: "AssistantToolCall",
  request: "AssistantRequest"
};

const chat = await createChat(prisma, llm, { 
  model: "gpt-4o",
  tableNames: tableNames 
});
```

### Using Tools

Tools are automatically tracked without additional configuration.

```typescript
import { WeatherTool } from "./tools/weather";

await chat.withTool(WeatherTool).ask("How is the weather in London?");

// Check your database: 
// The 'LlmToolCall' table will contain the 'get_weather' execution details.
```

---

## Error Handling

If an API call fails, NodeLLM follows a "clean rollback" strategy:
1. The pending Assistant message is **deleted**.
2. The initial User message is **preserved** so you have a record of the request for debugging.
3. The error is thrown for your application to handle.

This ensures your database doesn't fill up with "broken" chat turns.
