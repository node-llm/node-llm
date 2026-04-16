---
layout: default
title: Roadmap
nav_order: 99
---

# 🗺️ Project Roadmap

NodeLLM is evolving to support more complex AI-native Node.js applications.

---

### ✅ RECENTLY RELEASED
{: .no_toc }

- **[Extended Thinking](/core-features/reasoning)**: Unified interface for Claude 3.7, DeepSeek R1, and OpenAI o1/o3.
- **[Professional ORM Support](/orm/prisma)**: Database persistence for Prisma with automated history management and professional migration workflows.
- **Context Isolation 2.0**: Strict separation of system instructions and conversation turns for enterprise-grade safety.
- **[Model Context Protocol (MCP)](/packages/mcp)**: Professional integration for third-party tools, resources, and prompt templates. Ready for Phase 2 discovery.

---

## 🚀 Future Priorities

### 🧠 High-Level Orchestration
**Managed Chain-of-Thought Patterns.**

Beyond simple chat loops, we are building structured orchestration patterns for complex multi-step reasoning:
- **Planner/Executor Loops**: Automated sub-task decomposition.
- **Self-Correction Patterns**: Native support for LLM-based output validation and retry loops.

### 🧪 Evaluation Framework
**Integration Testing for AI.**

Measuring the quality of non-deterministic LLM outputs is hard. We are exploring a lightweight evaluation toolkit to help developers:
- **Snapshot Testing**: Lock down expected behaviors.
- **Prompt Regression Detection**: Ensure new model versions don't break your specialized instructions.

### 📂 Expanded Example Library

We learn by doing. We will double down on high-quality, full-stack reference implementations covering:

- **RAG Knowledge Base**: A verified pattern for "Chat with your Docs".
- **Voice Interface**: Real-time audio-in/audio-out.
- **Local-First Agent**: Zero-latency offline agents using Ollama + Llama 3.

---

## 🛡️ Ongoing

- **Security First**: Continued investment in Context Isolation, PII hooks, and adversarial defense.
- **Zero-Dependency Core**: Keeping the core library lightweight while moving heavy integrations to separate packages (e.g. `@node-llm/tools`).
