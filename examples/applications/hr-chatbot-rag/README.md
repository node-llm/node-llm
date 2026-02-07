# HR Chatbot with RAG 🤖

> **Why this matters**: Most LLM tools are stateless. If a user refreshes the page, their chat is gone. This project shows how to build a **helpful HR bot** that remembers past conversations and looks up company policies using a database.

![HR Chatbot Screenshot](hr-chatbot.png)

---

## 🛠️ Two Patterns: Chat API vs Agent Pattern

This example demonstrates **two approaches** to building persistent AI chatbots:

| URL | Pattern | Description |
|-----|---------|-------------|
| `http://localhost:3000/` | **Chat API** | Traditional approach with `AssistantChat.create()` + `withTool()` |
| `http://localhost:3000/agent` | **Agent Pattern** | New "Code Wins" approach with `HRPolicyAgent` class |

### Chat API (Traditional)
```typescript
// Tools attached on each request
const chat = await AssistantChat.create({ model: "gpt-4o" });
const response = await chat.withTool(searchDocumentsTool).ask(message);
```

### Agent Pattern (New) ⭐
```typescript
// Tools defined once in the class - "Code Wins"
class HRPolicyAgent extends Agent {
  static model = "gpt-4o";
  static instructions = "You are an HR assistant...";
  static tools = [SearchHRDocumentsTool];  // Built-in!
}

// Resume sessions with updated code (model upgrades, prompt fixes apply immediately)
const session = await HRAgentSession.create();
const response = await session.ask(message);  // No withTool() needed!
```

---

## 🚀 Getting Started

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

Required environment variables:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/hr_chatbot"
OPENAI_API_KEY="sk-..."
# or ANTHROPIC_API_KEY for Claude
```

### 3. Setup Database

```bash
# Apply database migrations
npm run db:migrate

# Seed the knowledge base with policy documents
npm run seed
```

### 4. Run the App

```bash
npm run dev
```

Then visit:
- **Chat Pattern**: http://localhost:3000/
- **Agent Pattern**: http://localhost:3000/agent

---

## 🧠 Key Files

| File | Purpose |
|------|---------|
| `src/app/chat-actions.ts` | Chat API server actions (old pattern) |
| `src/app/agent-actions.ts` | Agent API server actions (new pattern) |
| `src/agents/hr-policy-agent.ts` | `HRPolicyAgent` class with tools |
| `src/models/assistant-chat.ts` | `AssistantChat` ORM wrapper |
| `src/models/hr-agent-session.ts` | `HRAgentSession` ORM wrapper |
| `src/hooks/use-chat.ts` | React hook for Chat pattern |
| `src/hooks/use-agent-chat.ts` | React hook for Agent pattern |

---

## 🏗️ Architecture

### Data Model
The database schema (managed via Prisma) consists of:

| Table | Purpose |
|-------|---------|
| `AssistantChat` | Session metadata, model config, system instructions |
| `AssistantMessage` | Conversation history (user + assistant messages) |
| `AssistantToolCall` | Audit log of tool executions |
| `AssistantRequest` | Metrics: latency and token usage |
| `AssistantAgentSession` | Agent session metadata (new) |

---

Built with 💚 using [NodeLLM](https://github.com/node-llm/node-llm) — The architectural layer for Node.js AI.
