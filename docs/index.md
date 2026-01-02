---
layout: default
title: Home
nav_order: 1
permalink: /
---

# @node-llm/core

**One unified interface for OpenAI, Anthropic, Gemini, DeepSeek, and local models.**

**node-llm** abstracts away the chaos of vendor-specific SDKs. It gives you a clean, streaming-first API with built-in support for Vision, Tools, and Structured Outputs.

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
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" alt="Ollama" class="logo-medium">
    <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" alt="Ollama" class="logo-medium">
  </div>
</div>

[Get Started](/getting-started/overview){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 } [View on GitHub](https://github.com/eshaiju/node-llm){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## ⚡ Quick Example

```ts
import { LLM } from "@node-llm/core";

// 1. Configure once
LLM.configure({ provider: "openai" });

// 2. Basic Chat
const chat = LLM.chat("gpt-4o");
const response = await chat.ask("Explain Node.js");
console.log(response.content);

// 3. Streaming
for await (const chunk of chat.stream("Explain Node.js")) {
  process.stdout.write(chunk.content);
}
```

---

## 🔮 Capabilities

### 💬 Unified Chat
Stop rewriting code for every provider. `node-llm` normalizes inputs and outputs.

```ts
const chat = LLM.chat(); // Defaults to GPT-4o
await chat.ask("Hello world");
```

### 👁️ Smart Vision & Files
Pass images, PDFs, or audio files directly. We handle the base64 encoding and MIME types.

```ts
await chat.ask("Analyze this interface", { 
  files: ["./screenshot.png", "./specs.pdf"] 
});
```

### 🛠️ Auto-Executing Tools
Define tools once, and the library manages the execution loop for you.

```ts
const tools = [{
  type: 'function',
  function: { name: 'get_weather', ... },
  handler: async ({ loc }) => `Sunny in ${loc}`
}];

await chat.withTools(tools).ask("Weather in Tokyo?");
```

### ✨ Structured Output
Get type-safe JSON back using **Zod** schemas.

```ts
import { z } from "zod";

const Product = z.object({ name: z.string(), price: z.number() });
const res = await chat.withSchema(Product).ask("Generate a gadget");

console.log(res.parsed.name); // Type-safe access
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
Access the thought process of models like **DeepSeek R1** or **OpenAI o1/o3** using the `.reasoning` field.

```ts
const chat = LLM.chat("deepseek-reasoner");
const res = await chat.ask("Solve a complex puzzle");

console.log(res.reasoning); // Output the model's inner thought process
console.log(res.content);   // Output the final answer
```

---

## 🚀 Why use this over official SDKs?

| Feature | node-llm | Official SDKs |
| :--- | :--- | :--- |
| **API Style** | Consistent across all providers | Different for everyone |
| **Streaming** | Standard `AsyncIterator` | Callbacks/Events/Streams mixed |
| **Tools** | Automatic Execution Loop | Manual parsing & recursion |
| **Files** | Path string or URL | Base64 buffers / distinct types |
| **Retries** | Built-in & Configurable | Varies by SDK |

---

## 📋 Supported Providers

| Provider | Supported Features |
| :--- | :--- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" height="18"> | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" height="14"> | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> | Chat, Streaming, Tools, Vision, PDF Support, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" height="14"> | Chat (V3), **Reasoning (R1)**, Tools, Streaming, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/ollama-text.svg" height="12"> | **Local Inference**, Chat, Streaming, Tools, Vision, Embeddings |

---

## 🫶 Credits

Heavily inspired by the elegant design of [RubyLLM](https://rubyllm.com/).
