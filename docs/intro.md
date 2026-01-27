---
layout: default
title: Introduction
nav_order: 1
permalink: /docs/intro
---

<p align="left">
  <img src="/assets/images/logo.png" alt="NodeLLM" width="200" />
</p>

# Introduction

**A simple way to use Large Language Models in Node.js.**

**NodeLLM is an open-source infrastructure layer for building provider-agnostic, production-grade LLM systems in Node.js.**

Integrating multiple LLM providers often means juggling different SDKs, API styles, and update cycles. NodeLLM gives you a single, unified API that stays consistent even when providers change.

<p class="fs-3 text-grey-dk-000 mb-3">Unified support for</p>
<div class="provider-icons">
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" alt="OpenAI" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" alt="OpenAI" class="logo-medium">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" alt="Anthropic" class="logo-medium">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" alt="Gemini" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" alt="Gemini" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" alt="DeepSeek" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" alt="DeepSeek" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" alt="OpenRouter" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter-text.svg" alt="OpenRouter" class="logo-medium">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" alt="Ollama" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" alt="Ollama" class="logo-medium">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-color.svg" alt="Bedrock" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-text.svg" alt="Bedrock" class="logo-small">
  </div>
</div>

```
Your App
   ↓
NodeLLM (Unified API + State + Security)
   ↓
OpenAI | Anthropic | Bedrock | Ollama
```

---

## 🏗️ The "Backend-First" AI SDK

While most AI SDKs (like Vercel AI SDK) are heavily optimized for **Frontend Streaming** (Next.js, React Server Components), NodeLLM is built for the **Backend**.

It is the "AI SDK for the rest of us"—backend engineers building workers, cron jobs, CLI tools, Slack bots, and REST/GraphQL APIs that *aren't* Next.js.

### Strategic Principles

- **Provider Isolation**: Decouple your services from vendor SDKs.
- **Production-Ready**: Native support for streaming, retries, and unified error handling.
- **Predictable API**: Consistent behavior for Tools, Vision, and Structured Outputs across all models.

---

## ⚡ The 5-Minute Path

```ts
import { createLLM } from "@node-llm/core";

// 1. Explicit Initialization (Preferred)
const llm = createLLM({ provider: "openai" });
const chat = llm.chat("gpt-4o");

// 2. Chat (High-level request/response)
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// 3. Streaming (Standard AsyncIterator)
for await (const chunk of chat.stream("Explain event-driven architecture")) {
  process.stdout.write(chunk.content);
}
```

---

## 🛑 What NodeLLM is NOT

NodeLLM represents a clear architectural boundary between your system and LLM vendors.

NodeLLM is **NOT**:

- A wrapper around a single provider SDK (like `openai` or `@google/generative-ai`)
- A prompt-engineering framework
- An agent playground or experimental toy

---

## 🚀 Why Use This Over Official SDKs?

| Feature            | NodeLLM                       | Official SDKs               | Architectural Impact      |
| :----------------- | :---------------------------- | :-------------------------- | :------------------------ |
| **Provider Logic** | Transparently Handled         | Exposed to your code        | **Low Coupling**          |
| **Streaming**      | Standard `AsyncIterator`      | Vendor-specific Events      | **Predictable Data Flow** |
| **Tool Loops**     | Automated Recursion           | Manual implementation       | **Reduced Boilerplate**   |
| **Files/Vision**   | Intelligent Path/URL handling | Base64/Buffer management    | **Cleaner Service Layer** |
| **Configuration**  | Centralized & Global          | Per-instance initialization | **Easier Lifecycle Mgmt** |

---

## 🔮 Capabilities

### 💬 Unified Chat

Stop rewriting code for every provider. `NodeLLM` normalizes inputs and outputs into a single, predictable mental model.

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "openai" });
const chat = llm.chat("gpt-4o");
await chat.ask("Hello world");
```

### 🛠️ Auto-Executing Tools

Define tools once using our clean **Class-Based DSL**; NodeLLM manages the recursive execution loop for you.

```ts
import { Tool, z } from "@node-llm/core";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather";
  schema = z.object({ loc: z.string() });

  async handler({ loc }) {
    return `Sunny in ${loc}`;
  }
}

await chat.withTool(WeatherTool).ask("Weather in Tokyo?");
```

### 💾 [Persistence Layer](/orm/prisma)

Automatically track chat history, tool executions, and API metrics with **@node-llm/orm**. Now with full support for **Extended Thinking** persistence.

```ts
import { createChat } from "@node-llm/orm/prisma";

// Chat state is automatically saved to your database (Postgres/MySQL/SQLite)
const chat = await createChat(prisma, llm, { model: "claude-3-7-sonnet" });

await chat.withThinking({ budget: 16000 }).ask("Develop a strategy");
```

### 🧪 [Deterministic Testing](/core-features/testing)

Validate your AI agents with **VCR cassettes** (record/replay) and a **Fluent Mocker** for unit tests. No more flaky or expensive test runs.

```ts
import { vcr, Mocker } from "@node-llm/testing";

// 1. Integration Tests (VCR)
await vcr.useCassette("pricing_flow", async () => {
  const res = await chat.ask("How much?");
  expect(res.content).toContain("$20/mo");
});

// 2. Unit Tests (Mocker)
const mock = new Mocker()
  .chat("Next step?", "Login User")
  .tool("getCurrentUser", { id: 1 });
```

### 🛡️ [Security & Compliance](/advanced/security)

Implement custom security, PII detection, and compliance logic using pluggable asynchronous hooks (`beforeRequest` and `afterResponse`).

### 🔧 Strategic Configuration

NodeLLM provides a flexible configuration system designed for enterprise usage:

```ts
// Switch providers at the framework level
const llm = createLLM({ provider: "anthropic" });
```

### ⚡ Scoped Parallelism

Run multiple providers in parallel safely without global configuration side effects using isolated contexts.

```ts
const [gpt, claude] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt)
]);
```

### 🧠 [Extended Thinking](/core-features/reasoning)

Direct access to the thought process of modern reasoning models like **Claude 3.7**, **DeepSeek R1**, or **OpenAI o1/o3** using a unified interface.

```ts
const res = await chat
  .withThinking({ budget: 16000 })
  .ask("Solve this logical puzzle");

console.log(res.thinking.text); // Full chain-of-thought
```

---

## 📋 Supported Providers

| Provider                                                                                                                             | Supported Features                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI**            | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, **Reasoning**, **Smart Developer Role** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini**      | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings                                              |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, Streaming, Tools, Vision, PDF, Structured Output, **Extended Thinking (Claude 3.7)**            |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek**  | Chat (V3), **Extended Thinking (R1)**, Tools, Streaming                                              |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-color.svg" height="18"> **Bedrock**    | Chat, Streaming, Tools, Image Gen (Titan/SD), Embeddings, **Prompt Caching**                         |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="18"> **OpenRouter**    | **Aggregator**, Chat, Streaming, Tools, Vision, Embeddings, **Reasoning**                             |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama**            | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings                                       |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/node-llm/node-llm/blob/main/CONTRIBUTING.md) for more details on how to get started.

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).

---

**Upgrading to v1.6.0?** Read the [Migration Guide](/getting_started/migration-v1-6.html) to understand the new strict provider requirements and typed error hierarchy.
