# Brand Perception Checker Example

A full-stack example application built with **NodeLLM v1.5.3**, generic Node.js, and React. This project demonstrates how to orchestrate multiple LLM providers to perform a real-world research task: auditing how a brand is perceived by AI models versus live search results.

---

## 🛠 What this demonstrates
This example is designed to show how to build robust AI applications using `NodeLLM`'s core features:

- **Multi-Provider Orchestration**: querying OpenAI and Anthropic in parallel to cross-check results.
- **Structured Output**: using `withSchema()` (Zod) to forcefully extract clean JSON data from models.
- **Tool Agents**: using a `SerpTool` to fetch live Google Search results.
- **Resilience**: handling API failures gracefully without crashing the server.
- **Reasoning**: capturing the "thought process" of models like OpenAI's o3-mini.

## 🚀 Key Features
- **AI Consensus**: compares what `gpt-4o` and `claude-3` "know" about a brand from their training data.
- **Live Market Check**: cross-references AI knowledge with real-time Google Search snippets using `Serper.dev`.
- **Diagnostic Dashboard**: visualizes the "alignment" or "gap" between AI perception and market reality.
- **Clean Architecture**: separates business logic (`logic.js`) from AI orchestration (`agent.js`) for better testability.

## 📦 Setup & Run

### 1. Configure Keys
Create a `.env` file in the `server/` directory:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
SERPER_API_KEY=xxx... # Required for live Google search data
```

### 2. Run the Demo
We've included a script to install dependencies and start everything for you:

```bash
# Installs dependencies and starts both server (port 3001) & client (port 5173)
npm run demo
```

## 🧠 How it works
1. **Intrinsic Check**: We ask multiple models (OpenAI, Anthropic) to describe the brand based *only* on their latent knowledge.
2. **Market Check**: We use a `SerpTool` to search Google for the brand's current status (news, sentiment, competitors).
3. **Synthesis**: We compare the two sources. If the AI thinks the brand is "reliable" but recent news shows a "security breach," the system flags a **Truth Gap**.

---
Built with 💚 using [NodeLLM](https://github.com/node-llm/node-llm).
