<p align="left">
  <a href="https://node-llm.eshaiju.com/">
    <img src="https://node-llm.eshaiju.com/assets/images/logo.png" alt="NodeLLM logo" width="300" />
  </a>
</p>

# NodeLLM

**The Provider-Agnostic LLM Runtime for Node.js.**

**NodeLLM is a backend orchestration layer designed for building reliable, testable, and provider-agnostic AI systems.**

Integrating multiple LLM providers often means juggling different SDKs, API styles, and update cycles. NodeLLM gives you a single, unified API for over 540+ models across multiple providers (OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Ollama, etc.) that stays consistent even when providers change.

<p align="left">
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" height="22" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="18" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" height="20" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" height="20" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter-text.svg" height="22" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="28" />
  <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" height="18" />
</p>

<br/>

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/org/node-llm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

```bash
npm install @node-llm/core
```

---

## 🛑 What NodeLLM is NOT

To understand NodeLLM, you must understand what it is **NOT**.

NodeLLM is **NOT**:

- ❌ **A thin wrapper** around vendor SDKs (like `openai` or `@anthropic-ai/sdk`)
- ❌ **A UI streaming library** (like Vercel AI SDK)
- ❌ **A prompt-only framework**

NodeLLM **IS**:

- ✅ **A Backend Runtime**: Designed for workers, cron jobs, agents, and API servers.
- ✅ **Provider Agnostic**: Switches providers via config, not code rewrites.
- ✅ **Contract Driven**: Guarantees identical behavior for Tools and Streaming across all models.
- ✅ **Infrastructure First**: Built for evals, telemetry, retries, and circuit breaking.

---

## 🏗️ Why NodeLLM?

### The "Infrastructure-First" Approach

Most AI SDKs optimize for "getting a response to the user fast" (Frontend/Edge). NodeLLM optimizes for **system reliability** (Backend).

While most AI SDKs (like Vercel AI SDK) are heavily optimized for **Frontend Streaming** (Next.js, React Server Components), NodeLLM is built for the **Backend**.

- **Reasoning Models**: Native support for OpenAI o1/o3 and Anthropic Thinking models with first-class tokens tracking.
- **Middlewares**: Intercept and modify requests/responses for auditing, cost tracking, and PII redaction.
- **ORM & Persistence**: Save entire conversation threads, tool calls, and latency metrics to your database automatically.
- **Deterministic Testing**: Record and replay LLM interactions with VCR-style testing.
- **Strict Process Protection**: Preventing hung requests from stalling event loops.

### Strategic Goals

- **Decoupling**: Isolate your business logic from the rapid churn of AI model versions.
- **Production Safety**: Native support for circuit breaking, redaction, and audit logging.
- **Predictability**: A unified Mental Model for streaming, structured outputs, and vision.

---

## ⚡ The Architectural Path

```ts
import { NodeLLM } from "@node-llm/core";

// 1. Zero-Config (NodeLLM automatically reads NODELLM_PROVIDER and API keys)
const chat = NodeLLM.chat("gpt-4o");

// 2. Chat (High-level request/response)
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// 3. Streaming (Standard AsyncIterator)
for await (const chunk of chat.stream("Explain event-driven architecture")) {
  process.stdout.write(chunk.content);
}
```

### 🎯 Real-World Example: Brand Perception Checker

Built with NodeLLM - Multi-provider AI analysis, tool calling, and structured outputs working together.

**[View Example →](https://github.com/node-llm/node-llm/tree/main/examples/applications/brand-perception-checker)**

### 🤖 Flagship: HR Chatbot RAG

A production-grade Next.js application demonstrating **@node-llm/orm**, real-time streaming, and RAG architectures.

**[View Example →](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag)**

---

## 🔧 Strategic Configuration

NodeLLM provides a flexible, **lazy-initialized** configuration system designed for enterprise usage. It is safe for ESM and resolved only when your first request is made, eliminating the common `dotenv` race condition.

```ts
// Recommended for multi-provider pipelines
const llm = createLLM({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  ollamaApiBase: process.env.OLLAMA_API_BASE
});

// Support for Custom Endpoints (e.g., Azure or LocalAI)
const llm = createLLM({
  openaiApiKey: process.env.AZURE_KEY,
  openaiApiBase: "https://your-resource.openai.azure.com/openai/deployments/..."
});
```

**[Full Configuration Guide →](docs/getting_started/configuration.md)**

---

---

## 🔮 Capabilities

### 💬 Unified Chat

Stop rewriting code for every provider. `NodeLLM` normalizes inputs and outputs into a single, predictable mental model.

```ts
import { NodeLLM } from "@node-llm/core";

// Uses NODELLM_PROVIDER from environment (defaults to GPT-4o)
const chat = NodeLLM.chat();
await chat.ask("Hello world");
```

### 👁️ Smart Vision & Files

Pass images, PDFs, or audio files directly to **both `ask()` and `stream()`**. We handle the heavy lifting: fetching remote URLs, base64 encoding, and MIME type mapping.

```ts
await chat.ask("Analyze this interface", {
  files: ["./screenshot.png", "https://example.com/spec.pdf"]
});
```

### 🛠️ Auto-Executing Tools

Define tools once;`NodeLLM` manages the recursive execution loop for you, keeping your controller logic clean. **Works seamlessly with both regular chat and streaming!**

```ts
import { Tool, z } from "@node-llm/core";

// Class-based DSL
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather";
  schema = z.object({ location: z.string() });

  async execute({ location }) {
    return `Sunny in ${location}`;
  }
}

// Now the model can use it automatically
await chat.withTool(WeatherTool).ask("What's the weather in Tokyo?");

// Lifecycle Hooks for Error & Flow Control
chat.onToolCallError((call, err) => "STOP");
```

**[Full Tool Calling Guide →](https://node-llm.eshaiju.com/core-features/tool-calling)**

### 🔍 Comprehensive Debug Logging

Enable detailed logging for all API requests and responses across every feature and provider:

```ts
// Set environment variable
process.env.NODELLM_DEBUG = "true";

// Now see detailed logs for every API call:
// [NodeLLM] [OpenAI] Request: POST https://api.openai.com/v1/chat/completions
// { "model": "gpt-4o", "messages": [...] }
// [NodeLLM] [OpenAI] Response: 200 OK
// { "id": "chatcmpl-123", ... }
```

**Covers:** Chat, Streaming, Images, Embeddings, Transcription, Moderation - across all providers!

### ✨ Structured Output

Get type-safe, validated JSON back using **Zod** schemas.

```ts
import { z } from "@node-llm/core";
const Product = z.object({ name: z.string(), price: z.number() });

const res = await chat.withSchema(Product).ask("Generate a gadget");
console.log(res.parsed.name); // Full type-safety
```

### 🎨 Image Generation

```ts
await NodeLLM.paint("A cyberpunk city in rain");
```

### 🎤 Audio Transcription

```ts
await NodeLLM.transcribe("meeting-recording.wav");
```

### 💾 Persistence Layer

Automatically track chat history, tool executions, and API metrics with **@node-llm/orm**.

```ts
import { createChat } from "@node-llm/orm/prisma";

// Chat state is automatically saved to your database (Postgres/MySQL/SQLite)
const chat = await createChat(prisma, llm, { model: "gpt-4o" });

await chat.ask("Hello");
// -> Saves User Message
// -> Saves Assistant Response
// -> Tracks Token Usage & Cost
// -> Logs Tool Calls & Results
```

### ⚡ Scoped Parallelism

Run multiple providers in parallel safely without global configuration side effects using isolated contexts.

```ts
const [gpt, claude] = await Promise.all([
  // Each call branch off into its own isolated context
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt)
]);
```

### 🧠 Deep Reasoning

Direct access to the thought process of models like **DeepSeek R1** or **OpenAI o1/o3** using the `.reasoning` field.

```ts
const res = await NodeLLM.chat("deepseek-reasoner").ask("Solve this logical puzzle");
console.log(res.reasoning); // Chain-of-thought
```

### 🔒 Agentic Zero Trust

Security is not an afterthought. NodeLLM includes a native **"Invisible Perimeter"** to protect your infrastructure:

- **Redaction**: Automatically masks API keys in logs.
- **Guardrails**: Integrated support for Bedrock/Azure safety filters.
- **Auditing**: Full prompt/response tracing via `@node-llm/orm`.

---

## 🚀 Why use this over official SDKs?

| Feature               | NodeLLM                       | Official SDKs               | Architectural Impact      |
| :-------------------- | :---------------------------- | :-------------------------- | :------------------------ |
| **Provider Logic**    | Transparently Handled         | Exposed to your code        | **Low Coupling**          |
| **Streaming**         | Standard `AsyncIterator`      | Vendor-specific Events      | **Predictable Data Flow** |
| **Streaming + Tools** | Automated Execution           | Manual implementation       | **Seamless UX**           |
| **Tool Loops**        | Automated Recursion           | Manual implementation       | **Reduced Boilerplate**   |
| **Files/Vision**      | Intelligent Path/URL handling | Base64/Buffer management    | **Cleaner Service Layer** |
| **Configuration**     | Centralized & Global          | Per-instance initialization | **Easier Lifecycle Mgmt** |

---

## 📋 Supported Providers

| Provider                                                                                                                             | Supported Features                                                               |
| :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI**            | Chat, **Streaming + Tools**, Vision, Audio, Images, Transcription, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini**      | Chat, **Streaming + Tools**, Vision, Audio, Video, Embeddings                    |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, **Streaming + Tools**, Vision, PDF, Structured Output                      |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek**  | Chat (V3), **Reasoning (R1)**, **Streaming + Tools**                             |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/aws.svg" height="18"> **AWS Bedrock**          | **Nova, Titan, Claude 3/3.5**, Streaming, Tools, Vision, Guardrails              |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="18"> **OpenRouter**    | **Aggregator**, Chat, Streaming, Tools, Vision, Embeddings, **Reasoning**        |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama**            | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings                  |

---

## 📚 Documentation & Installation

```bash
npm install @node-llm/core
```

**[View Full Documentation ↗](https://node-llm.eshaiju.com/)**

### 🍿 Try the Live Demo

Want to see it in action? Run this in your terminal:

```bash
git clone https://github.com/node-llm/node-llm.git
cd node-llm
npm install
npm run demo
```

---

## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](CONTRIBUTING.md)** for more details on how to get started.

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).

---

## 📄 License

MIT © [NodeLLM contributors]
