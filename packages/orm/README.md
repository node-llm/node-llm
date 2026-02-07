# @node-llm/orm

[![npm version](https://img.shields.io/npm/v/@node-llm/orm.svg)](https://www.npmjs.com/package/@node-llm/orm)
[![npm downloads](https://img.shields.io/npm/dm/@node-llm/orm.svg)](https://www.npmjs.com/package/@node-llm/orm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> Database persistence layer for NodeLLM. Automatically tracks chats, messages, tool calls, and API requests.

**[Read the Full Documentation](https://node-llm.eshaiju.com/orm/prisma)** | **[View Example App](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag)**

## Features

- ✅ **Automatic Persistence** - Messages, tool calls, and API metrics saved automatically
- ✅ **Streaming Support** - Real-time token delivery with `askStream()`
- ✅ **Provider Agnostic** - Works with any NodeLLM provider (OpenAI, Anthropic, Gemini, OpenRouter, etc.)
- ✅ **Type Safe** - Full TypeScript support with Prisma
- ✅ **Audit Trail** - Complete history of tool executions and API calls
- ✅ **Flexible** - Prisma adapter included, other ORMs can be added

## Installation

```bash
npm install @node-llm/orm @node-llm/core @prisma/client
npm install -D prisma
```

## Quick Start

### Option 1: Using the CLI (Recommended)

```bash
# Generate schema.prisma automatically
npx node-llm-orm init

# Create and apply migration
npx prisma migrate dev --name init
npx prisma generate
```

### Option 2: Manual Setup

Copy the reference schema into your project:

```bash
cp node_modules/@node-llm/orm/schema.prisma prisma/schema.prisma
```

Or manually add the models to your existing `prisma/schema.prisma`:

```prisma
model LlmChat {
  id           String       @id @default(uuid())
  model        String?
  provider     String?
  instructions String?      @db.Text
  metadata     String?      @db.Text
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  messages     LlmMessage[]
  requests     LlmRequest[]
}

model LlmMessage {
  id           String        @id @default(uuid())
  chatId       String
  role         String
  content      String?       @db.Text
  // ... see schema.prisma for full definition
}

model LlmToolCall {
  id         String   @id @default(uuid())
  messageId  String
  toolCallId String
  name       String
  arguments  String   @db.Text
  // ... see schema.prisma for full definition
}

model LlmRequest {
  id           String   @id @default(uuid())
  chatId       String
  messageId    String?
  provider     String
  model        String
  // ... see schema.prisma for full definition
}
```

### 2. Run Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Use the ORM

```typescript
import { PrismaClient } from "@prisma/client";
import { createLLM } from "@node-llm/core";
import { createChat } from "@node-llm/orm/prisma";

const prisma = new PrismaClient();
const llm = createLLM({ provider: "openai" });

// Create a new chat
const chat = await createChat(prisma, llm, {
  model: "gpt-4",
  instructions: "You are a helpful assistant."
});

// Ask a question (automatically persisted)
const response = await chat.ask("What is the capital of France?");
console.log(response.content); // "The capital of France is Paris."

// View conversation history
const messages = await chat.messages();
console.log(messages); // [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
```

## Architecture

The ORM tracks five core entities:

| Model               | Purpose              | Example                                    |
| ------------------- | -------------------- | ------------------------------------------ |
| **LlmAgentSession** | Agent persistence    | Links Agent class to Chat (v0.5.0+)        |
| **LlmChat**         | Session container    | Holds model, provider, system instructions |
| **LlmMessage**      | Conversation history | User queries and assistant responses       |
| **LlmToolCall**     | Tool executions      | Function calls made by the assistant       |
| **LlmRequest**      | API metrics          | Token usage, latency, cost per API call    |

### Data Flow

```
User Input
    ↓
Chat.ask()
    ↓
┌─────────────────────────────────────┐
│ 1. Create User Message (DB)        │
│ 2. Create Assistant Message (DB)   │
│ 3. Fetch History (DB)              │
│ 4. Call LLM API                     │
│    ├─ onToolCallEnd → ToolCall (DB)│
│    └─ afterResponse → Request (DB) │
│ 5. Update Assistant Message (DB)   │
└─────────────────────────────────────┘
    ↓
Return Response
```

## Agent Sessions (v0.5.0+)

For **stateful agents** with persistence, use `AgentSession`. This follows the "Code Wins" principle:

- **Model, Tools, Instructions** → from Agent class (code)
- **Message History** → from database

### Define an Agent (in @node-llm/core)

```typescript
import { Agent, Tool, z } from "@node-llm/core";

class LookupOrderTool extends Tool {
  static definition = {
    name: "lookup_order",
    description: "Look up order status",
    parameters: z.object({ orderId: z.string() })
  };
  async execute({ orderId }) {
    return { status: "shipped", eta: "Tomorrow" };
  }
}

class SupportAgent extends Agent {
  static model = "gpt-4.1";
  static instructions = "You are a helpful support agent.";
  static tools = [LookupOrderTool];
}
```

### Create & Resume Sessions

```typescript
import { createAgentSession, loadAgentSession } from "@node-llm/orm/prisma";

// Create a new persistent session
const session = await createAgentSession(prisma, llm, SupportAgent, {
  metadata: { userId: "user_123", ticketId: "TKT-456" }
});

await session.ask("Where is my order #789?");
console.log(session.id); // "sess_abc123" - save this!

// Resume later (even after code upgrades)
const session = await loadAgentSession(prisma, llm, SupportAgent, "sess_abc123");
await session.ask("Can you cancel it?");
```

### Code Wins Principle

When you deploy a code change (new model, updated tools), resumed sessions use the **new configuration**:

| Aspect       | Source      | Why                             |
| ------------ | ----------- | ------------------------------- |
| Model        | Agent class | Immediate upgrades              |
| Tools        | Agent class | Only code can execute functions |
| Instructions | Agent class | Deploy prompt fixes immediately |
| History      | Database    | Sacred, never modified          |

### Schema Addition

Add `LlmAgentSession` to your Prisma schema:

```prisma
model LlmAgentSession {
  id         String   @id @default(uuid())
  agentClass String   // For validation (e.g., 'SupportAgent')
  chatId     String   @unique
  metadata   Json?    // Session context (userId, ticketId)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  chat       LlmChat  @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@index([agentClass])
  @@index([createdAt])
}

// Add relation to LlmChat
model LlmChat {
  // ... existing fields
  agentSession LlmAgentSession?
}
```

## Advanced Usage

### Streaming Responses

For real-time UX, use `askStream()` to yield tokens as they arrive:

```typescript
import { createChat } from "@node-llm/orm/prisma";

const chat = await createChat(prisma, llm, {
  model: "gpt-4"
});

// Stream tokens in real-time
for await (const token of chat.askStream("Tell me a story")) {
  process.stdout.write(token); // Print each token immediately
}

// Message is automatically persisted after streaming completes
const messages = await chat.messages();
console.log(messages[messages.length - 1].content); // Full story
```

### React/Next.js Streaming Example

```typescript
// app/api/chat/route.ts
import { createChat } from "@node-llm/orm/prisma";

export async function POST(req: Request) {
  const { message, chatId } = await req.json();

  const chat = chatId
    ? await loadChat(prisma, llm, chatId)
    : await createChat(prisma, llm, { model: "gpt-4" });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const token of chat.askStream(message)) {
        controller.enqueue(new TextEncoder().encode(token));
      }
      controller.close();
    }
  });

  return new Response(stream);
}
```

### Custom Table Names

If you have existing tables with different names (e.g., `AssistantChat` instead of `Chat`), you can specify custom table names:

```typescript
import { createChat } from "@node-llm/orm/prisma";

const tableNames = {
  chat: "assistantChat",
  message: "assistantMessage",
  toolCall: "assistantToolCall",
  request: "assistantRequest"
};

// Create chat with custom table names
const chat = await createChat(prisma, llm, { model: "gpt-4" }, tableNames);

// Load chat (must use same table names)
const loaded = await loadChat(prisma, llm, chatId, tableNames);
```

**Note**: Your Prisma schema model names must match the table names you specify. For example:

```prisma
model AssistantChat {
  // ... fields
  @@map("assistantChat") // Optional: map to different database table name
}
```

### With Tools

```typescript
import { createChat } from "@node-llm/orm/prisma";
import { searchTool } from "./tools/search";

const chat = await createChat(prisma, llm, {
  model: "gpt-4",
  tools: [searchTool]
});

await chat.ask("Search for NodeLLM documentation");
// Tool calls are automatically persisted to ToolCall table
```

### Loading Existing Chats

```typescript
import { loadChat } from "@node-llm/orm/prisma";

const chat = await loadChat(prisma, llm, "chat-id-123");
if (chat) {
  await chat.ask("Continue our conversation");
}
```

### Querying Metrics

```typescript
// Get all API requests for a chat
const requests = await prisma.request.findMany({
  where: { chatId: chat.id },
  orderBy: { createdAt: "desc" }
});

console.log(
  `Total tokens: ${requests.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0)}`
);
console.log(`Total cost: $${requests.reduce((sum, r) => sum + (r.cost || 0), 0)}`);
```

### Custom Fields & Metadata

You can add custom fields (like `userId`, `projectId`, `tenantId`) to your Prisma schema and pass them directly to `createChat`. The library will pass these fields through to the generic Prisma create call.

**1. Update your Prisma Schema:**

```prisma
model LlmChat {
  // ... standard fields
  metadata     Json?      // Use Json type for flexible storage
  userId       String?    // Custom field
  projectId    String?    // Custom field
}
```

**2. Pass fields to createChat:**

```typescript
const chat = await createChat(prisma, llm, {
  model: "gpt-4",
  instructions: "You are consistent.",
  // Custom fields passed directly
  userId: "user_123",
  projectId: "proj_abc",
  // Metadata is passed as-is (native JSON support)
  metadata: {
    source: "web-client",
    tags: ["experiment-a"]
  }
});
```

### Persistence Configuration

By default, the ORM persists everything: messages, tool calls, and API requests. If you don't need certain tables (e.g., you're building a minimal app without tool tracking), you can disable specific persistence features:

```typescript
const chat = await createChat(prisma, llm, {
  model: "gpt-4",
  persistence: {
    toolCalls: false, // Skip LlmToolCall table
    requests: false // Skip LlmRequest table
  }
});
```

**Use Cases:**

- **Minimal Schema**: Only create `LlmChat` and `LlmMessage` tables
- **Privacy**: Disable request logging for sensitive applications
- **Performance**: Reduce database writes for high-throughput scenarios

**Note**: Message persistence is always enabled (required for conversation history).

## Environment Variables

The ORM respects NodeLLM's provider configuration:

```bash
# Chat Provider
NODELLM_PROVIDER="openrouter"
NODELLM_MODEL="google/gemini-2.0-flash-001"

# Embedding Provider (optional, for RAG apps)
NODELLM_EMBEDDING_PROVIDER="openai"
NODELLM_EMBEDDING_MODEL="text-embedding-3-small"
```

## Roadmap

- [ ] TypeORM adapter
- [ ] Drizzle adapter
- [ ] Migration utilities
- [ ] Analytics dashboard
- [ ] Export/import conversations

## License

MIT
