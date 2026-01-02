<p align="left">
  <img src="docs/assets/images/logo.jpg" alt="node-llm logo" width="300" />
</p>

# @node-llm/core
**One unified interface for OpenAI, Anthropic, Gemini, DeepSeek, and local models.**

**node-llm** abstracts away the chaos of vendor-specific SDKs. It gives you a clean, streaming-first API with built-in support for Vision, Tools, and Structured Outputs.

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
</p>

<br/>

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
---

## ⚡ Quick Example

```ts
import { LLM } from "@node-llm/core";

// Configure your provider
LLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
});

LLM.configure({ provider: "openai" });

// Chat with streaming
const chat = LLM.chat("gpt-4o");
for await (const chunk of chat.stream("Explain Node.js")) {
  process.stdout.write(chunk.content);
}
```

---

## 🔧 Configuration

`node-llm` provides a flexible configuration system:

```ts
// Callback style (recommended for multiple providers)
LLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.geminiApiKey = process.env.GEMINI_API_KEY;
  config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
});

// Object style (quick provider switching)
LLM.configure({
  openaiApiKey: "sk-...",
  provider: "openai"
});

// Custom endpoints (e.g., Azure OpenAI)
LLM.configure({
  openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
  openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT,
  provider: "openai"
});
```

**[View Full Configuration Guide →](docs/CONFIGURATION.md)**

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

## � Supported Providers

| Provider | Supported Features |
| :--- | :--- |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/openai-text.svg" height="18"> | Chat, Streaming, Tools, Vision, Audio, Images, Transcription, **Reasoning** |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-color.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/gemini-text.svg" height="14"> | Chat, Streaming, Tools, Vision, Audio, Video, Embeddings |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/anthropic-text.svg" height="12"> | Chat, Streaming, Tools, Vision, PDF Support, Structured Output |
| <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-color.svg" height="18"> <img src="https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/deepseek-text.svg" height="14"> | Chat (V3), **Reasoning (R1)**, Tools, Streaming, Structured Output |

---

## �🚀 Why use this over official SDKs?

| Feature | node-llm | Official SDKs |
| :--- | :--- | :--- |
| **API Style** | Consistent across all providers | Different for everyone |
| **Streaming** | Standard `AsyncIterator` | Callbacks/Events/Streams mixed |
| **Tools** | Automatic Execution Loop | Manual parsing & recursion |
| **Files** | Path string or URL | Base64 buffers / distinct types |
| **Retries** | Built-in & Configurable | Varies by SDK |

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
