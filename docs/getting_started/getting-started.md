layout: default
title: Quick Start
nav_order: 2
parent: Getting Started
---

# Getting Started

Start building AI apps in Node.js in 5 minutes. Chat, generate images, and create embeddings with one unified API.

## Installation

```bash
npm install @node-llm/core
# or
pnpm add @node-llm/core
```

## Configuration

Configure your providers once at the entry point of your app.

```ts
import { LLM } from "@node-llm/core";
import "dotenv/config";

// 1. Ensure keys are in process.env (e.g. via dotenv)
// process.env.OPENAI_API_KEY = "sk-..."

// 2. Configure defaults
LLM.configure({
  provider: "openai",
  defaultModel: "gpt-4o",
});
```

## Quick Start Examples

### 1. Chat
```ts
const chat = LLM.chat(); // Uses default model
const response = await chat.ask("Explain quantum computing in 5 words.");
console.log(response.content);
// => "Computing using quantum mechanical phenomena."
```

### 2. Generate Images
```ts
const image = await LLM.paint("A cyberpunk city with neon rain");
console.log(image.url);
```

### 3. Create Embeddings
```ts
const embedding = await LLM.embed("Semantic search is powerful.");
console.log(`Vector dimensions: ${embedding.dimensions}`);
```

### 4. Streaming
Real-time responses are essential for good UX.

```ts
for await (const chunk of chat.stream("Write a poem")) {
  process.stdout.write(chunk.content);
}
```

## Next Steps

*   [Chat Features](../core-features/chat.html): Learn about history, system prompts, and JSON mode.
*   [Multimodal](../core-features/multimodal.html): Send images, audio, and documents.
*   [Tool Calling](../core-features/tools.html): Give your AI ability to execute code.
