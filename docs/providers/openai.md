---
layout: default
title: OpenAI
parent: Providers
nav_order: 1
description: Full support for the complete range of NodeLLM features including tool calling, vision, image generation, and the advanced Developer role.
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

The OpenAI provider supports the full range of \`NodeLLM\` features, including robust tool calling, vision, and structured outputs.

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "openai", openaiApiKey: process.env.OPENAI_API_KEY, // Optional if set in env });
```

## Specific Parameters

You can pass OpenAI-specific parameters using `.withParams()`.

```ts
const chat = llm.chat("gpt-4o").withParams({
  seed: 42, // for deterministic output
  user: "user-123", // for user tracking
  presence_penalty: 0.5,
  frequency_penalty: 0.5
});
```

## Features

- **Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, etc.
- **Vision**: specific models like `gpt-4o` support image analysis.
- **Tools**: Fully supported, including parallel tool execution.
- **Reasoning**: Automatic tracking of reasoning tokens and costs for `o1` and `o3` models.
- **Smart Developer Role**: Modern instructions are automatically mapped to the `developer` role for compatible models when using the official API.
- **Structured Output**: Supports strict schema validation via `json_schema`.

## Custom Endpoints

OpenAI's client is also used for compatible services like Ollama, LocalAI, and Azure OpenAI. See [Custom Endpoints](/advanced/custom_endpoints.html) for details.
