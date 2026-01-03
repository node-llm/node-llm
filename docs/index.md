---
layout: default
title: Home
nav_order: 1
permalink: /
---

# @node-llm/core
**An opinionated architectural layer for using Large Language Models in Node.js.**

Build chatbots, autonomous agents, and RAG pipelines without the SDK fatigue. node-llm provides a unified, production-oriented API for interacting with multiple LLM providers (OpenAI, Gemini, Anthropic, DeepSeek, OpenRouter, Ollama, etc.) without coupling your application to any single SDK.

<br/>

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
</div>

<br/>

[Get Started](/getting-started/overview){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 } [View on GitHub](https://github.com/eshaiju/node-llm){: .btn .fs-5 .mb-4 .mb-md-0 }

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

## 🏗️ Why node-llm?

Most AI integrations today are provider-specific, SDK-driven, and leaky at abstraction boundaries. This creates long-term architectural risk. Switching models should not mean a total rewrite of your business logic.

node-llm exists to solve **architectural problems**, not just provide API access. It is the "Standard Library" for LLMs in the Node.js ecosystem.

### Strategic Principles
- **Provider Isolation**: Decouple your services from vendor SDKs.
- **Production-Ready**: Native support for streaming, retries, and unified error handling.
- **Predictable API**: Consistent behavior for Tools, Vision, and Structured Outputs across all models.

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

## 🚀 Why use this over official SDKs?

| Feature | node-llm | Official SDKs | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Provider Logic** | Transparently Handled | Exposed to your code | **Low Coupling** |
| **Streaming** | Standard `AsyncIterator` | Vendor-specific Events | **Predictable Data Flow** |
| **Tool Loops** | Automated Recursion | Manual implementation | **Reduced Boilerplate** |
| **Files/Vision** | Intelligent Path/URL handling | Base64/Buffer management | **Cleaner Service Layer** |
| **Configuration** | Centralized & Global | Per-instance initialization | **Easier Lifecycle Mgmt** |

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

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).
