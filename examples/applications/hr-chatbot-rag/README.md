# HR Chatbot with RAG 🤖

> **Why this matters**: Most LLM tools are stateless. If a user refreshes the page, their chat is gone. This project shows how to build a **helpful HR bot** that remembers past conversations and looks up company policies using a database.

![HR Chatbot Screenshot](hr-chatbot.png)

---

## 🛠️ How it works: A Bot that Remembers

Building a basic chat is easy; building one that stays useful over time is where things get tricky. This project handles:
1. **Chat History**: Saving every message to PostgreSQL so people can pick up where they left off.
2. **Policy Search**: Giving the bot access to documents so it doesn't give wrong answers.
3. **Usage Logging**: Keeping track of how many tokens are used and which tools are called.

### Built with NodeLLM & @node-llm/orm
The `@node-llm` tools handle the database boilerplate for you:
- **Core logic**: Handles the chat turns and policy searches.
- **ORM layer**: Automatically saves the conversation to your database as it happens.

---

## 🚀 Getting Started

If you were building this from scratch, you would start by installing the essential packages:

```bash
npm install @node-llm/core @node-llm/orm
```

### 1. Clone & Install

```bash
# If you haven't cloned NodeLLM yet
git clone https://github.com/node-llm/node-llm.git
cd node-llm/examples/applications/hr-chatbot-rag

# Install all dependencies
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your API keys. A PostgreSQL database with the `pgvector` extension is required.

```bash
cp .env.example .env
```

### 3. Setup Database (Migrations)

Initialize your PostgreSQL database with the correct schema and knowledge base.

```bash
# Apply database migrations
npm run db:migrate

# Seed the knowledge base with policy documents
npm run seed
```

---

## 🧠 The "Convention Over Configuration" Logic

Notice in `src/models/assistant-chat.ts` how the ORM handles the heavy lifting. Instead of manual `prisma.message.create` calls, you simply use:

```typescript
import { createChat } from "@node-llm/orm/prisma";

// The chat object now automatically persists to the DB
const chat = await createChat(prisma, llm, {
  model: "gpt-4o",
  persistence: { toolCalls: true, requests: true }
});

await chat.ask("What is our remote work policy?");
```

---

## 🏗️ Architecture detail

### Data Model
The database schema (managed via Prisma) consists of the following key tables:

| Table | Purpose |
|-------|---------|
| `AssistantChat` | Stores session metadata, model config, and system instructions. |
| `AssistantMessage` | The logical conversation history (User query + Assistant Answer). |
| `AssistantToolCall` | Audit log of every tool executed (args, names) during a turn. |
| `AssistantRequest` | *Optional metrics.* Latency and cost per HTTP request. |

---

Built with 💚 using [NodeLLM](https://github.com/node-llm/node-llm) — The architectural layer for Node.js AI.
