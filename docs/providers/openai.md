---
layout: default
title: OpenAI
nav_order: 1
parent: Providers
---

# OpenAI Provider

The OpenAI provider supports the full range of `node-llm` features, including robust tool calling, vision, and structured outputs.

## Configuration

```ts
import { NodeLLM } from "@node-llm/core";

NodeLLM.configure({
  provider: "openai",
  openaiApiKey: process.env.OPENAI_API_KEY, // Optional if set in env
});
```

## Specific Parameters

You can pass OpenAI-specific parameters using `.withParams()`.

```ts
const chat = NodeLLM.chat("gpt-4o")
  .withParams({ 
    seed: 42,           // for deterministic output
    user: "user-123",   // for user tracking
    presence_penalty: 0.5,
    frequency_penalty: 0.5
  });
```

## Features

- **Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, etc.
- **Vision**: specific models like `gpt-4o` support image analysis.
- **Tools**: Fully supported, including parallel tool execution.
- **Reasoning**: Automatic tracking of reasoning tokens and costs for `o1` and `o3` models.
- **Structured Output**: Supports strict schema validation via `json_schema`.

## Custom Endpoints

OpenAI's client is also used for compatible services like Ollama, LocalAI, and Azure OpenAI. See [Custom Endpoints](../advanced/custom_endpoints.md) for details.
