---
layout: default
title: xAI (Grok)
parent: Providers
nav_order: 8
description: Native support for xAI's Grok models including chat, streaming, vision, structured output, reasoning, and image generation.
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

The xAI provider gives you access to the Grok family of models through a clean, NodeLLM-native interface. It supports all core NodeLLM features including streaming, vision, structured outputs, reasoning, and image generation.

---

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({
  provider: "xai",
  xaiApiKey: process.env.XAI_API_KEY
});
```

Or via environment variables:

```env
NODELLM_PROVIDER=xai
XAI_API_KEY=xai-...
```

Then use zero-config:

```ts
import { NodeLLM } from "@node-llm/core";

const chat = NodeLLM.chat("grok-3");
```

---

## Available Models

| Model                  | Features                                        |
| :--------------------- | :---------------------------------------------- |
| `grok-3`               | Chat, Streaming, Tools, Structured Output        |
| `grok-3-mini`          | Chat, Streaming, Tools, **Reasoning**            |
| `grok-2-1212`          | Chat, Streaming, Tools, Structured Output        |
| `grok-2-vision-1212`   | Chat, Streaming, **Vision**, Structured Output   |
| `grok-imagine-image`   | **Image Generation**                            |

For the full list, run:

```ts
const models = await llm.listModels();
```

---

## Features

### 💬 Chat

```ts
const chat = llm.chat("grok-3");
const response = await chat.ask("Explain event-driven architecture.");
console.log(response.content);
```

### ⚡ Streaming

```ts
for await (const chunk of chat.stream("Tell me about Node.js")) {
  process.stdout.write(chunk.content || "");
}
```

### 👁️ Vision

Use `grok-2-vision-1212` to analyze images by passing mixed content arrays:

```ts
const chat = llm.chat("grok-2-vision-1212");

const response = await chat.ask([
  { type: "text", text: "What is in this image?" },
  { type: "image_url", image_url: { url: "https://example.com/image.jpg" } }
]);
```

### ✨ Structured Output

```ts
import { z } from "@node-llm/core";

const Schema = z.object({
  name: z.string(),
  age: z.number(),
  hobbies: z.array(z.string())
});

const response = await chat.withSchema(Schema).ask("Create a fictional user profile.");
console.log(response.parsed); // Fully typed
```

### 🧠 Reasoning

`grok-3-mini` is a reasoning model. Reasoning tokens are tracked automatically.

```ts
const chat = llm.chat("grok-3-mini");
const response = await chat.ask("Solve this logic puzzle: ...");

console.log(response.content);    // Final answer
console.log(response.usage);      // Includes reasoning_tokens
```

### 🎨 Image Generation

```ts
const response = await llm.paint("A futuristic city at night, cyberpunk style", {
  model: "grok-imagine-image"
});

console.log(response.url); // URL of generated image
```

### 🛠️ Tool Calling

```ts
import { Tool, z } from "@node-llm/core";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a city";
  schema = z.object({ city: z.string() });

  async execute({ city }) {
    return `Sunny in ${city}`;
  }
}

const response = await chat.withTool(WeatherTool).ask("What's the weather in London?");
```

---

## Supported Features Summary

| Feature               | Supported |
| :-------------------- | :-------: |
| Chat                  | ✅        |
| Streaming             | ✅        |
| Tool Calling          | ✅        |
| Structured Output     | ✅        |
| Vision                | ✅        |
| Image Generation      | ✅        |
| Reasoning             | ✅        |
| Embeddings            | ❌        |
| Transcription         | ❌        |
| Moderation            | ❌        |

---

## Getting an API Key

Sign up and get your API key at [console.x.ai](https://console.x.ai).
