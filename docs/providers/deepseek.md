---
layout: default
title: DeepSeek
parent: Providers
nav_order: 4
description: Access high-performance chat and advanced reasoning models with competitive pricing and full support for the DeepSeek R1 thought process.
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

The DeepSeek provider offers high-performance chat and reasoning models with competitive pricing. \`NodeLLM\` supports both the DeepSeek-V3 chat model and the DeepSeek-R1 reasoning model.

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "deepseek", deepseekApiKey: process.env.DEEPSEEK_API_KEY, // Optional if set in env });
```

## Specific Parameters

You can pass DeepSeek-specific parameters using `.withParams()`.

```ts
const chat = llm.chat("deepseek-chat").withParams({
  presence_penalty: 0.5,
  frequency_penalty: 0.5,
  top_p: 0.9
});
```

## Features

- **Models**:
  - `deepseek-chat`: Optimized for speed and proficiency in broad tasks (DeepSeek-V3).
  - `deepseek-reasoner`: Optimized for complex reasoning and problem solving (DeepSeek-R1).
- **Tools**: Supported on `deepseek-chat`.
- **Reasoning**: Access inner thought process text from `deepseek-reasoner`.
- **Streaming**: Full streaming support for all models.
- **Structured Output**: Supported via automated prompt engineering and `json_object` mode transitions.

## Usage Details

DeepSeek provides OpenAI-compatible endpoints, but `NodeLLM` handles the specific capability differences (like reasoning vs tool support) automatically through its internal registry.
