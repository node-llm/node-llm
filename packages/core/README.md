<p align="left">
  <img src="../../docs/assets/images/logo.jpg" alt="node-llm logo" width="300" />
</p>

# @node-llm/core

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**An opinionated architectural layer for using Large Language Models in Node.js.**

node-llm provides a unified, production-oriented API for interacting with over **540+ models** across multiple providers (OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Ollama, etc.) without coupling your application to any single SDK.

---

## ⚡ The Golden Path

```ts
import { LLM } from "@node-llm/core";

// 1. Configure once
LLM.configure({ provider: "openai" });

// 2. Chat (High-level request/response)
const chat = LLM.chat("gpt-4o");
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// 3. Streaming (Standard AsyncIterator)
for await (const chunk of chat.stream("Explain event-driven architecture")) {
  process.stdout.write(chunk.content);
}
```

---

### Why node-llm?

Most AI integrations today are provider-specific and create long-term architectural risk. node-llm exists to solve these problems by providing:

- **Provider Isolation**: Your application never touches a provider SDK directly.
- **Unified Mental Model**: Tools, vision, and structured outputs feel identical across providers.
- **Production-First**: Core concern for streaming, retries, and error handling.

<br/>

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

---

## 🔮 Capabilities

### 💬 Unified Chat
Stop rewriting code for every provider. `node-llm` normalizes inputs and outputs into a single, predictable mental model.
```ts
const chat = LLM.chat(); // Defaults to GPT-4o
await chat.ask("Hello world");
```

### 👁️ Smart Vision & Files
Pass images, PDFs, or audio files directly. We handle the heavy lifting: fetching remote URLs, base64 encoding, and MIME type mapping.
```ts
await chat.ask("Analyze this interface", { 
  files: ["./screenshot.png", "https://example.com/spec.pdf"] 
});
```

### 🛠️ Auto-Executing Tools
Define tools once; node-llm manages the recursive execution loop for you, keeping your controller logic clean.
```ts
const tools = [{
  handler: async ({ loc }) => `Sunny in ${loc}`,
  function: { name: 'get_weather', description: 'Get current weather', parameters: { ... } }
}];

await chat.withTools(tools).ask("Weather in Tokyo?");
```

### ✨ Structured Output
Get type-safe, validated JSON back using **Zod** schemas.
```ts
import { z } from "zod";
const Product = z.object({ name: z.string(), price: z.number() });

const res = await chat.withSchema(Product).ask("Generate a gadget");
console.log(res.parsed.name); // Full type-safety
```

### 🎨 Image Generation
```ts
await LLM.paint("A cyberpunk city in rain");
```

### 🎤 Audio Transcription
```ts
await LLM.transcribe("meeting-recording.wav");
```

### 🧠 Deep Reasoning
Direct access to the thought process of models like **DeepSeek R1** or **OpenAI o1/o3** using the `.reasoning` field.
```ts
const res = await LLM.chat("deepseek-reasoner").ask("Solve this logical puzzle");
console.log(res.reasoning); // Chain-of-thought
```

---

## 🚀 Why use this over official SDKs?

| Feature | node-llm | Official SDKs | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Provider Logic** | Transparently Handled | Exposed to your code | **Low Coupling** |
| **Streaming** | Standard `AsyncIterator` | Vendor-specific Events | **Predictable Data Flow** |
| **Tool Loops** | Automated Recursion | Manual implementation | **Reduced Boilerplate** |
| **Files/Vision** | Intelligent Path/URL handling | Base64/Buffer management | **Cleaner Service Layer** |

---

## 📋 Supported Providers

| Provider | Supported Features |
| :--- | :--- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI** | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini** | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, Streaming, Tools, Vision, PDF, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek** | Chat (V3), **Reasoning (R1)**, Tools, Streaming |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openrouter.svg" height="18"> **OpenRouter** | **Aggregator**, Chat, Streaming, Tools, Vision, Embeddings, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> **Ollama** | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings |

---

## 📚 Documentation & Installation

```bash
npm install @node-llm/core
```

**[View Full Documentation ↗](https://node-llm.eshaiju.com/)**

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).
