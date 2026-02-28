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

[![npm version](https://badge.fury.io/js/@node-llm%2Fcore.svg)](https://www.npmjs.com/package/@node-llm/core)
[![GitHub Repository](https://img.shields.io/badge/GitHub-node--llm-blue?logo=github)](https://github.com/node-llm/node-llm)
[![CI](https://github.com/node-llm/node-llm/actions/workflows/cicd.yml/badge.svg)](https://github.com/node-llm/node-llm/actions/workflows/cicd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Provider-Agnostic LLM Runtime for Node.js.**

**NodeLLM is a backend orchestration layer designed for building reliable, testable, and provider-agnostic AI systems.**

It is not a "simple API wrapper" or a "prompt engineering tool." NodeLLM deals with the hard infrastructure problems: normalizing streaming across providers, managing tool execution loops, enforcing timeouts, and enabling first-class testing and telemetry.

<p class="fs-4 text-grey-dk-000 mb-3">Unified support for</p>
<div class="provider-icons">
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" alt="OpenAI">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" alt="Anthropic">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" alt="Gemini">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" alt="DeepSeek">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" alt="OpenRouter">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" alt="Ollama">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" alt="">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-color.svg" alt="Bedrock">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/bedrock-text.svg" alt="" class="logo-small">
  </div>
  <div class="provider-logo">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai.svg" alt="xAI">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai-text.svg" alt="" class="logo-small">
  </div>
</div>

```text
                Your App
                   ↓
NodeLLM (Unified API + State + Security)
                   ↓
 OpenAI | Anthropic | Bedrock | xAI | Ollama
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

## 🏗️ The "Infrastructure-First" Approach

Most AI SDKs optimize for "getting a response to the user fast" (Frontend/Edge). NodeLLM optimizes for **system reliability** (Backend).

It is designed for architects and platform engineers who need:

- **Strict Process Protection**: Preventing hung requests from stalling event loops.
- **Normalized Persistence**: Treating chat interactions as database records via `@node-llm/orm`.
- **Determinism**: Testing your AI logic with VCR recordings and time-travel debugging.

### Strategic Goals

- **Decoupling**: Isolate your business logic from the rapid churn of AI model versions.
- **Production Safety**: Native support for circuit breaking, redaction, and audit logging.
- **Predictability**: A unified Mental Model for streaming, structured outputs, and vision.

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

Automatically track chat history, tool executions, and API metrics with [**@node-llm/orm**](https://www.npmjs.com/package/@node-llm/orm). Now with full support for **Extended Thinking** persistence.

```ts
import { createChat } from "@node-llm/orm/prisma";

// Chat state is automatically saved to your database (Postgres/MySQL/SQLite)
const chat = await createChat(prisma, llm, { model: "claude-3-7-sonnet" });

await chat.withThinking({ budget: 16000 }).ask("Develop a strategy");
```

### 🧪 [Deterministic Testing](/core-features/testing)

Validate your AI agents with **VCR cassettes** (record/replay) and a **Fluent Mocker** for unit tests. No more flaky or expensive test runs. Powered by [**@node-llm/testing**](https://www.npmjs.com/package/@node-llm/testing).

```ts
import { vcr, Mocker } from "@node-llm/testing";

// 1. Integration Tests (VCR)
await vcr.useCassette("pricing_flow", async () => {
  const res = await chat.ask("How much?");
  expect(res.content).toContain("$20/mo");
});

// 2. Unit Tests (Mocker)
const mock = new Mocker()
  .chat("Next step?")
  .respond("Login User")
  .callsTool("getCurrentUser", { id: 1 });
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
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/xai-text.svg" height="12"> **xAI** | Chat, Streaming, Tools, Vision, Images, **Reasoning**                                                |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama**            | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings                                       |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/node-llm/node-llm/blob/main/CONTRIBUTING.md) for more details on how to get started.

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).

---

**Upgrading to v1.6.0?** Read the [Migration Guide](/getting_started/migration-v1-6.html) to understand the new strict provider requirements and typed error hierarchy.
