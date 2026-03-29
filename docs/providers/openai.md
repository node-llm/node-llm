---
layout: default
title: OpenAI
parent: Providers
nav_order: 1
description: Full support for the complete range of NodeLLM features including tool calling, vision, image generation, and the advanced Developer role.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.0.0+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The OpenAI provider supports the full range of `NodeLLM` features, including robust tool calling, vision, and structured outputs.

---

## Configuration

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ 
  provider: "openai", 
  openaiApiKey: process.env.OPENAI_API_KEY // Optional if set in env 
});
```

---

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

---

## Features

- **Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, etc.
- **Vision**: Specific models like `gpt-4o` support image analysis.
- **Tools**: Fully supported, including parallel tool execution.
- **Reasoning**: Automatic tracking of reasoning tokens and costs for `o1` and `o3` models.
- **Smart Developer Role**: Modern instructions are automatically mapped to the `developer` role for compatible models when using the official API.
- **Strict Structured Output**: Supports OpenAI's "Strict Mode" for 100% schema adherence.
- **Predicted Outputs**: Optimize latency for code-editing tasks by providing expected output previews.

---

## Strict Mode

OpenAI's "Strict Mode" ensures that the model's output exactly matches your JSON schema with 100% reliability. When enabled, OpenAI generates a context-free grammar from your schema to constrain the output.

### Using Strict Mode with Schema
By default, `NodeLLM` enables strict mode when you use `.withSchema()`.

```ts
const chat = llm.chat("gpt-4o-mini").withSchema(myZodSchema);
// Internally sets strict: true and enforces additionalProperties: false
```

### Using Strict Mode with Tools
You can enable strict mode for individual tools by setting the `strict` property to `true`.

```ts
class MyTool extends Tool {
  name = "my_tool";
  strict = true; // Enables OpenAI Strict Mode for this tool
  schema = z.object({ ... });
}
```

---

## Predicted Outputs

For tasks like code refactoring or document editing where much of the output is already known, you can use **Predicted Outputs** to significantly reduce latency.

```ts
const originalCode = "function foo() { return true; }";

const response = await chat
  .withPrediction(originalCode) // Provide the expected/existing content
  .ask("Refactor this to return false:\n\n" + originalCode);
```

When using `.withPrediction()`, OpenAI only generates the "diffs," allowing it to stream results much faster. `NodeLLM` safely ignores this parameter for other providers, so your code remains portable.

---

## Custom Endpoints

OpenAI's client is also used for compatible services like Ollama, LocalAI, and Azure OpenAI. See [Custom Endpoints](/advanced/custom_endpoints.html) for details.

---

## Getting an API Key

Sign up and get your API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
