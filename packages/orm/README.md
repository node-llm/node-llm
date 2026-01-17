# @node-llm/orm

Database persistence layer for NodeLLM. Automatically tracks chats, messages, tool calls, and API requests.

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

### 1. Setup Prisma Schema

Copy the reference schema into your project:

```bash
cp node_modules/@node-llm/orm/schema.prisma prisma/schema.prisma
```

Or manually add the models to your existing `prisma/schema.prisma`:

```prisma
model Chat {
  id           String    @id @default(uuid())
  model        String?
  provider     String?
  instructions String?   @db.Text
  metadata     String?   @db.Text
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  messages     Message[]
  requests     Request[]
}

model Message {
  id           String    @id @default(uuid())
  chatId       String
  role         String
  content      String?   @db.Text
  // ... see schema.prisma for full definition
}

model ToolCall {
  id         String   @id @default(uuid())
  messageId  String
  toolCallId String
  name       String
  arguments  String   @db.Text
  // ... see schema.prisma for full definition
}

model Request {
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

The ORM tracks four core entities:

| Model        | Purpose              | Example                                    |
| ------------ | -------------------- | ------------------------------------------ |
| **Chat**     | Session container    | Holds model, provider, system instructions |
| **Message**  | Conversation history | User queries and assistant responses       |
| **ToolCall** | Tool executions      | Function calls made by the assistant       |
| **Request**  | API metrics          | Token usage, latency, cost per API call    |

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
