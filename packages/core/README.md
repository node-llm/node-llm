# @node-llm/core

[![npm version](https://img.shields.io/npm/v/@node-llm/core.svg)](https://www.npmjs.com/package/@node-llm/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A provider-agnostic LLM core for Node.js, heavily inspired by the elegant design of [ruby-llm](https://github.com/crmne/ruby_llm).

`node-llm` focuses on clean abstractions, minimal magic, and a streaming-first design. It provides a unified interface to interact with various LLM providers without being locked into their specific SDKs.

---

## 🚀 Features

- **Provider-Agnostic**: Switch between OpenAI, Anthropic, and others with a single line of config.
- **Streaming-First**: Native `AsyncIterator` support for real-time token delivery.
- **Tool Calling**: Automatic execution loop for model-requested functions.
- **Multi-modal & Smart Files**: Built-in support for Vision (images), Audio, and Text files.
- **Fluent API**: Chainable methods like `.withTool()` for dynamic registration.
- **Resilient**: Configurable retry logic at the execution layer.
- **Type-Safe**: Written in TypeScript with full ESM support.

---

## 📦 Installation

```bash
npm install @node-llm/core
# or
pnpm add @node-llm/core
```

---

## 🛠️ Quick Start

### 1. Configure the Provider

```ts
import { LLM } from "@node-llm/core";
import "dotenv/config";

LLM.configure({
  provider: "openai", // Uses OPENAI_API_KEY from env
  retry: { attempts: 3, delayMs: 500 }
});
```

### 2. Basic Chat

```ts
const chat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a helpful assistant."
});

const reply = await chat.ask("What is the speed of light?");
console.log(reply);
```

### 3. Streaming Responses

```ts
for await (const token of chat.stream("Write a short poem about Node.js")) {
  process.stdout.write(token);
}
```

---

## 🔌 Advanced Usage

### Tool Calling (Function Calling)

Define your tools and let the library handle the execution loop automatically.

```ts
const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string' } }
    }
  },
  handler: async ({ location }) => {
    return JSON.stringify({ location, temp: 22, unit: 'celsius' });
  }
};

// Use the fluent API to add tools on the fly
const reply = await chat
  .withTool(weatherTool)
  .ask("What is the weather in London?");
```

### Multi-modal & File Support

Pass local paths or URLs directly. The library handles reading, MIME detection, and encoding.

```ts
// Vision
await chat.ask("What's in this image?", {
  files: ["./screenshot.png"]
});

// Audio
await chat.ask("Transcribe this", {
  files: ["./meeting.mp3"]
});

// Text/Code Analysis
await chat.ask("Explain this code", {
  files: ["./app.ts"]
});
```

---

## 📋 Supported Providers

| Provider | Status | Notes |
| :--- | :--- | :--- |
| **OpenAI** | ✅ Supported | Chat, Streaming, Tools, Vision, Audio |
| **Anthropic** | 🏗️ Roadmap | Coming soon |
| **Azure OpenAI** | 🏗️ Roadmap | Coming soon |

---

## 🧠 Design Philosophy

- **Explicit over Implicit**: No hidden side effects.
- **Minimal Dependencies**: Lightweight core with zero bloat.
- **Developer Experience**: Inspired by Ruby's elegance, built for Node's performance.
- **Production Ready**: Built-in retries and strict type checking.

---

## 📄 License

MIT © [node-llm contributors]
