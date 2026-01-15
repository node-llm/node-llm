---
layout: default
title: Roadmap
nav_order: 99
---

# 🗺️ Project Roadmap

NodeLLM is evolving to support more complex AI-native Node.js applications.

---

## 🚀 Near-Term Priorities

### 💾 Managed State & Persistence
**Seamless Long-Term Memory.**

We are exploring "Persistence Adapters" for standard Node.js ORMs (Prisma, Drizzle). Instead of complex class inheritance, we provide modular adapters that automatically sync conversion state to your database.

```ts
// Concept: Persistence Adapters
import { PrismaAdapter } from "@node-llm/prisma";

// Bind the LLM directly to a database record
const chat = NodeLLM.chat("gpt-4o", {
  persistence: new PrismaAdapter(prisma.chat, { id: "chat_123" })
});

// Automatically fetches history -> Calls API -> Saves response
await chat.ask("Continue where we left off");
```

*   **Schema-Driven**: Define your chat schema in Prisma/Drizzle, we handle the sync.
*   **Zero-State**: Your Node.js process stays stateless; history lives in Postgres/MySQL.
*   **Goal**: Drop-in persistence for any Node.js backend.

### 📂 Expanded Example Library
We learn by doing. We will double down on high-quality, full-stack reference implementations covering:

*   **RAG Knowledge Base**: A verified pattern for "Chat with your Docs".
*   **Voice Interface**: Real-time audio-in/audio-out.
*   **Local-First Agent**: Zero-latency offline agents using Ollama + Llama 3.

---

## 🛡️ Ongoing
*   **Security First**: Continued investment in Context Isolation, PII hooks, and adversarial defense.
*   **Zero-Dependency Core**: Keeping the core library lightweight while moving heavy integrations to separate packages (e.g. `@node-llm/tools`).
