---
layout: default
title: DeepSeek
nav_order: 4
parent: Providers
---

# DeepSeek Provider

The DeepSeek provider offers high-performance chat and reasoning models with competitive pricing. `node-llm` supports both the DeepSeek-V3 chat model and the DeepSeek-R1 reasoning model.

## Configuration

```ts
import { LLM } from "@node-llm/core";

LLM.configure({
  provider: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY, // Optional if set in env
});
```

## Specific Parameters

You can pass DeepSeek-specific parameters using `.withParams()`.

```ts
const chat = LLM.chat("deepseek-chat")
  .withParams({ 
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
- **Streaming**: Full streaming support for all models.
- **Structured Output**: Supported via automated prompt engineering and `json_object` mode transitions.

## Usage Details

DeepSeek provides OpenAI-compatible endpoints, but `node-llm` handles the specific capability differences (like reasoning vs tool support) automatically through its internal registry.
