---
layout: default
title: OpenRouter
parent: Providers
nav_order: 5
description: Access hundreds of open-source and proprietary models through a single gateway with unified tool calling, vision, and reasoning support.
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

The OpenRouter provider acts as a unified gateway to AI models from multiple providers. \`NodeLLM\` leverages OpenRouter's standardized API while providing additional capabilities like integrated tool calling and vision.

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "openrouter", openrouterApiKey: process.env.OPENROUTER_API_KEY });
```

## Features

- **Model Discovery**: Full support for `NodeLLM.listModels()` to explore available models.
- **Unified API**: Switch between models from OpenAI, Anthropic, Google, and Meta using a single configuration.
- **Vision**: Supported for multimodal models.
- **Tools**: Supported for models with function calling capabilities.
- **Reasoning**: Access chain-of-thought for reasoning-capable models (e.g., DeepSeek R1).
- **Streaming**: Native streaming support with the advanced `Stream` utility.

## Specific Parameters

OpenRouter supports various unique parameters that can be passed via `.withParams()`:

```ts
const chat = llm.chat("google/gemini-2.0-flash-exp:free").withParams({
  transforms: ["middle-out"], // OpenRouter specific compression
  route: "fallback"
});
```
