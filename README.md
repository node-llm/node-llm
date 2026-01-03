<p align="left">
  <img src="docs/assets/images/logo.jpg" alt="node-llm logo" width="300" />
</p>

# node-llm
**An opinionated architectural layer for using Large Language Models in Node.js.**

Build chatbots, autonomous agents, and RAG pipelines without the SDK fatigue. node-llm provides a unified, production-oriented API for interacting with over **540+ models** across multiple providers (OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Ollama, etc.) without coupling your application to any single SDK.

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

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## ⚡ The Golden Path

```ts
import { NodeLLM } from "@node-llm/core";

// 1. Configure once
NodeLLM.configure({ provider: "openai" });

// 2. Chat (High-level request/response)
const chat = NodeLLM.chat("gpt-4o");
const response = await chat.ask("Explain event-driven architecture");
console.log(response.content);

// 3. Streaming (Standard AsyncIterator)
for await (const chunk of chat.stream("Explain event-driven architecture")) {
  process.stdout.write(chunk.content);
}
```

---

## Why node-llm?

Most AI integrations today are provider-specific, SDK-driven, and leaky at abstraction boundaries. This creates long-term architectural risk. Switching models should not mean a total rewrite of your business logic.

node-llm exists to solve **architectural problems**, not just provide API access.

### Strategic Goals

- **Provider Isolation**: Your application logic never touches a provider-specific SDK.
- **Unified Mental Model**: Chat, streaming, tools, and structured outputs feel identical across providers.
- **Production-Ready**: Streaming, retries, and errors are first-class concerns. 
- **The "Standard Library" Voice**: It provides a beautiful, native-feeling API for modern Node.js.

### Non-Goals

- It is **not** a thin wrapper that mirrors every provider's unique API knobs.
- It is **not** a UI framework or a simple chatbot builder.
- It prioritizes **architectural clarity** over raw SDK convenience.

---

## 🔧 Strategic Configuration

node-llm provides a flexible configuration system designed for enterprise usage:

```ts
// Recommended for multi-provider pipelines
NodeLLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.ollamaApiBase = process.env.OLLAMA_API_BASE;
});

// Switch providers at the framework level
NodeLLM.configure({ provider: "anthropic" });

// Support for Custom Endpoints (e.g., Azure or LocalAI)
NodeLLM.configure({
  openaiApiKey: process.env.AZURE_KEY,
  openaiApiBase: "https://your-resource.openai.azure.com/openai/deployments/...",
});
```

**[Full Configuration Guide →](docs/getting_started/configuration.md)**

---

---

## 🔮 Capabilities

### 💬 Unified Chat
Stop rewriting code for every provider. `node-llm` normalizes inputs and outputs into a single, predictable mental model.
```ts
const chat = NodeLLM.chat(); // Defaults to GPT-4o
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
Define tools once; node-llm manages the recursive execution loop for you, keeping your controller logic clean. **Works seamlessly with both regular chat and streaming!**
```ts
const tools = [{
  handler: async ({ loc }) => `Sunny in ${loc}`,
  function: { name: 'get_weather', description: 'Get current weather', parameters: { ... } }
}];

// Tools work in regular chat
await chat.withTools(tools).ask("Weather in Tokyo?");

// Tools also work in streaming! 🎉
for await (const chunk of chat.withTools(tools).stream("Weather in Tokyo?")) {
  process.stdout.write(chunk.content);
}
// Tool is automatically executed and response continues streaming
```

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
import { z } from "zod";
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

### 🧠 Deep Reasoning
Direct access to the thought process of models like **DeepSeek R1** or **OpenAI o1/o3** using the `.reasoning` field.
```ts
const res = await NodeLLM.chat("deepseek-reasoner").ask("Solve this logical puzzle");
console.log(res.reasoning); // Chain-of-thought
```

---
---

## 🚀 Why use this over official SDKs?

| Feature | node-llm | Official SDKs | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Provider Logic** | Transparently Handled | Exposed to your code | **Low Coupling** |
| **Streaming** | Standard `AsyncIterator` | Vendor-specific Events | **Predictable Data Flow** |
| **Streaming + Tools** | Automated Execution | Manual implementation | **Seamless UX** |
| **Tool Loops** | Automated Recursion | Manual implementation | **Reduced Boilerplate** |
| **Files/Vision** | Intelligent Path/URL handling | Base64/Buffer management | **Cleaner Service Layer** |
| **Configuration** | Centralized & Global | Per-instance initialization | **Easier Lifecycle Mgmt** |

---

## 📋 Supported Providers

| Provider | Supported Features |
| :--- | :--- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> **OpenAI** | Chat, **Streaming + Tools**, Vision, Audio, Images, Transcription, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> **Gemini** | Chat, **Streaming + Tools**, Vision, Audio, Video, Embeddings |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> **Anthropic** | Chat, **Streaming + Tools**, Vision, PDF, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> **DeepSeek** | Chat (V3), **Reasoning (R1)**, **Streaming + Tools** |
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

---

## 📄 License

MIT © [node-llm contributors]
