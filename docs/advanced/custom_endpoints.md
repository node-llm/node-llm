---
layout: default
title: Custom Endpoints
parent: Advanced
nav_order: 4
description: Connect NodeLLM to LiteLLM, Ollama, or any OpenAI-compatible API and use custom models outside the standard registry.
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

`NodeLLM` is flexible enough to connect to any OpenAI-compatible service and use custom models.

---

## OpenAI-Compatible Endpoints

Connect to services like LiteLLM or Ollama by configuring the base URL.

### Generic Configuration

Set `OPENAI_API_BASE` to your custom endpoint:

```bash
# LiteLLM
export OPENAI_API_KEY="your-litellm-key"
export OPENAI_API_BASE="https://your-proxy.litellm.ai/v1"

# Ollama (Local)
export OPENAI_API_KEY="not-needed"
export OPENAI_API_BASE="http://localhost:11434/v1"
```

### Azure

Azure has its own provider, which signs requests the way Azure expects and reaches every model a resource deploys. See [Azure AI Foundry](/providers/azure.html).

---

## Using Custom Models

If you use a model ID not in the built-in registry (e.g., a fine-tune or a new release), use `assumeModelExists: true` to bypass validation.

```typescript
const chat = llm.chat("my-company-gpt-4", {
  assumeModelExists: true,
  // Provider is typically required if not already configured globally
  provider: "openai"
});

await chat.ask("Hello");
```

This flag is available on all major methods:

```typescript
// Embeddings
await NodeLLM.embed("text", {
  model: "custom-embedder",
  assumeModelExists: true
});

// Image Generation
await NodeLLM.paint("prompt", {
  model: "custom-dalle",
  assumeModelExists: true
});
```

**Note:** When using this flag, strict capability checks (e.g., whether a model supports vision) are skipped. Make sure the model can actually handle what you ask of it.
