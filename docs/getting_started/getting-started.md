---
layout: default
title: Quick Start
nav_order: 2
parent: Getting Started
permalink: /getting-started/quick-start
description: A 5-minute guide to get started with NodeLLM. Install, configure, and run your first chat, image generation, and embedding scripts.
---

# {{ page.title }}

{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents

{: .no_toc .text-delta }

1. TOC
{:toc}

---

Start building AI apps in Node.js in 5 minutes. Chat, generate images, and create embeddings with one unified API.

## Installation

```bash
npm install @node-llm/core
# or
pnpm add @node-llm/core
```

## Configuration

The fastest way to start is using **Zero-Config**. NodeLLM automatically reads your API keys and the active provider from environment variables.

```ts
import "dotenv/config";
import { NodeLLM } from "@node-llm/core";

// 1. Ensure NODELLM_PROVIDER=openai and OPENAI_API_KEY=... are in .env
const llm = NodeLLM; // Exported singleton, ready to go!
```

Alternatively, use **Explicit Configuration** for multi-tenant or multi-provider apps:

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({
  provider: "openai",
  openaiApiKey: process.env.OPENAI_API_KEY
});
```

## Quick Start Examples

### 1. Chat

```ts
const chat = llm.chat(); // Uses default model
const response = await chat.ask("Explain quantum computing in 5 words.");
console.log(response.content);
// => "Computing using quantum mechanical phenomena."
```

### 2. Generate Images

```ts
const image = await llm.paint("A cyberpunk city with neon rain");
console.log(image.url);
```

### 3. Create Embeddings

```ts
const embedding = await llm.embed("Semantic search is powerful.");
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

- [Chat Features](/core-features/chat.html): Learn about history, system prompts, and JSON mode.
- [Multimodal](/core-features/multimodal.html): Send images, audio, and documents.
- [Tool Calling](/core-features/tools.html): Give your AI ability to execute code.
- [Migration Guide (v1.6)](/getting_started/migration-v1-6): Moving from legacy mutable versions.
