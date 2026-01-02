---
layout: default
title: Anthropic
nav_order: 3
parent: Providers
---

# Anthropic Provider

The Anthropic provider gives access to the Claude family of models, known for high-quality reasoning and coding capabilities.

## Configuration

```ts
import { LLM } from "@node-llm/core";

LLM.configure({
  provider: "anthropic",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY, // Optional if set in env
});
```

## Specific Parameters

You can pass Anthropic-specific parameters or custom headers.

```ts
const chat = LLM.chat("claude-3-5-sonnet-20241022")
  .withParams({ 
    top_k: 50,
    top_p: 0.9,
    // Custom headers if needed
    headers: {
      "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
    }
  });
```

## Features

- **Models**: `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-opus`, `claude-3-haiku`.
- **Vision**: Analyzes images.
- **PDF Support**: Can read and analyze PDF documents natively.
- **Tools**: Fully supported.
- **Reasoning**: Support for Extended Thinking and token-based pricing for `claude-3-7`.

## PDF Support

Anthropic supports sending PDF files as base64 encoded blocks, which `node-llm` handles automatically.

```ts
await chat.ask("Summarize this document", {
  files: ["./report.pdf"]
});
```
