# Brand Perception Checker 🔍

> **Why this matters**: Official LLM SDKs are often tied to one vendor. This example shows how to build a research tool that uses multiple models (OpenAI + Anthropic) to compare what the AI "thinks" against real market data.

![Dashboard Screenshot](./demo.png)

---

## 🛠️ How it works: Comparing AI and Reality

This application helps you see if AI models have the right impression of a brand:
1. **Ask different models** (OpenAI, Anthropic) what they know about a brand.
2. **Search Google** in real-time to get the latest facts.
3. **Show the difference** between the AI's training data and today's news.

### Built with NodeLLM
Using NodeLLM makes this much easier by handling the repetitive parts:
- **Switch effortlessly**: Running GPT-4 and Claude-3 side-by-side with the same code.
- **Search tools**: A simple tool to fetch Google results without complex loops.
- **Clean data**: Using Zod schemas to make sure the results are always ready for the dashboard.

---

## 🚀 Getting Started

If you were building this from scratch, you would start by installing the core library:

```bash
npm install @node-llm/core
```

### 1. Run the Demo Project

We've included a script to install dependencies and start the full-stack app (React + Node.js) for you:

```bash
# From the root of this project
npm run demo
```

### 2. Configure Environment

Create a `.env` file in the `server/` directory:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
SERPER_API_KEY=xxx... # Required for live Google search data
```

---

## 🧠 Key Logic: The Agent Flow

The core logic resides in `server/agent.js`. Notice how NodeLLM allows you to swap models or add tools without changing your business logic:

```javascript
const chat = NodeLLM.chat(model)
  .withTool(SerpTool)
  .withSchema(PerceptionSchema);

const response = await chat.ask(`Analyze the brand: ${brandName}`);
```

---

Built with 💚 using [NodeLLM](https://github.com/node-llm/node-llm) — The architectural layer for Node.js AI.

