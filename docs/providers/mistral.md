---
layout: default
title: Mistral AI
parent: Providers
nav_order: 10
description: Access Mistral AI's powerful language models including Mistral Large, Mistral Small, Codestral, and Pixtral for vision tasks.
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

The Mistral provider offers access to Mistral AI's range of language models, from efficient small models to powerful large models with vision and code capabilities.

---

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ 
  provider: "mistral", 
  mistralApiKey: process.env.MISTRAL_API_KEY // Optional if set in env 
});
```

---

## Specific Parameters

You can pass Mistral-specific parameters using `.withParams()`.

```ts
const chat = llm.chat("mistral-large-latest").withParams({
  temperature: 0.7,
  top_p: 0.9,
  safe_prompt: true
});
```

---

## Features

- **Models**:
  - `mistral-large-latest`: Most capable model for complex tasks.
  - `mistral-medium-latest`: Balanced performance and efficiency.
  - `mistral-small-latest`: Fast and cost-effective for simpler tasks.
  - `codestral-latest`: Optimized for code generation and understanding.
  - `pixtral-large-latest`: Vision-capable multimodal model.
  - `mistral-embed`: Text embedding model for semantic search.
- **Tools**: Supported on all chat models.
- **Vision**: Supported via `pixtral-large-latest` model.
- **Streaming**: Full streaming support for all chat models.
- **Structured Output**: Supported via JSON schema definitions.
- **Embeddings**: Supported via `mistral-embed` model.

---

## Vision Example

```ts
import { createLLM, Content } from "@node-llm/core";

const llm = createLLM({ provider: "mistral" });

const response = await llm
  .chat("pixtral-large-latest")
  .say(Content.text("What's in this image?").image("https://example.com/photo.jpg"))
  .then((r) => r.text);
```

---

## Embeddings Example

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "mistral" });

const result = await llm.embed("mistral-embed", "Hello world");
console.log(result.vectors[0]); // [0.123, -0.456, ...]
```

---

## Getting an API Key

Sign up and get your API key at [console.mistral.ai](https://console.mistral.ai).
