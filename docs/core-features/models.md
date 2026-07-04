---
layout: default
title: Models & Registry
parent: Core Features
nav_order: 6
description: Programmatically discover available models, their capabilities, and real-time costs using our built-in registry powered by models.dev.
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

\`NodeLLM\` includes a comprehensive, built-in registry of models using data from **models.dev**. This allows you to discover models and their capabilities programmatically.

---

## Inspecting a Model

You can look up any supported model to check its context window, costs, and features.

```ts
import { createLLM } from "@node-llm/core";

const model = NodeLLM.models.find("gpt-4o");

if (model) {
  console.log(`Provider: ${model.provider}`);
  console.log(`Context Window: ${model.context_window} tokens`);
  console.log(`Input Price: $${model.pricing.text_tokens.standard.input_per_million}/1M`);
  console.log(`Output Price: $${model.pricing.text_tokens.standard.output_per_million}/1M`);
}
```

---

## Discovery by Capability <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v0.8.0+</span>

You can filter the registry to find models that match your requirements.

### Finding Vision Models

```ts
const visionModels = NodeLLM.models.all().filter((m) => m.capabilities.includes("vision"));

console.log(`Found ${visionModels.length} vision-capable models.`);
visionModels.forEach((m) => console.log(m.id));
```

### Finding Tool-Use Models

```ts
const toolModels = NodeLLM.models.all().filter((m) => m.capabilities.includes("tools"));
```

### Finding Audio Models

```ts
const audioModels = NodeLLM.models.all().filter((m) => m.capabilities.includes("audio_input"));
```

---

## Supported Providers

The registry includes models from:

- **OpenAI** (GPT-4o, GPT-3.5, DALL-E)
- **Anthropic** (Claude 3.5 Sonnet, Haiku, Opus)
- **Google Gemini** (Gemini 1.5 Pro, Flash)
- **DeepSeek** (DeepSeek V3, R1)
- **AWS Bedrock** (Nova, Titan, Claude) <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.8.0+</span>
- **OpenRouter** (400+ models)
- **xAI** (Grok)
- **Ollama** (Local models)
- **Mistral** (Mistral Large, Codestral, Pixtral, Magistral) <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.14.0+</span>

---

## Usage & Cost Tracking

Every `ChatResponseString` returned from `chat.ask()` carries a `.usage` object plus convenience getters, so you can log spend without querying the registry yourself.

```ts
const response = await chat.ask("Summarize this document");

console.log(response.input_tokens); // Prompt tokens
console.log(response.output_tokens); // Completion tokens
console.log(response.cached_tokens); // Tokens served from a provider cache <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.6em; font-weight: 600; vertical-align: middle;">v1.5.2+</span>
console.log(response.usage.cache_creation_tokens); // Tokens written to a new prompt cache (Anthropic)

console.log(response.cost); // Total cost in USD
console.log(response.input_cost); // Cost attributable to input tokens
console.log(response.output_cost); // Cost attributable to output tokens
```

### Manual Cost Calculation

You can also calculate cost for a raw usage object (e.g., persisted usage loaded from your database) using `ModelRegistry.calculateCost()`:

```ts
import { ModelRegistry } from "@node-llm/core";

const priced = ModelRegistry.calculateCost(
  { input_tokens: 1000, output_tokens: 500, total_tokens: 1500, cached_tokens: 200 },
  "gpt-4o",
  "openai"
);

console.log(priced.cost); // Computed total cost in USD
```

---

## Custom Models & Endpoints

Sometimes you need to use models not in the registry, such as **Azure OpenAI** deployments, **Local Models** (Ollama/LM Studio), or brand new releases.

### Using `assumeModelExists`

This flag tells \`NodeLLM\` to bypass the registry check.

**Important**: You MUST specify the `provider` when using this flag, as the system cannot infer it from the ID.

```ts
const chat = NodeLLM.withProvider("openai").chat("my-custom-deployment", {
  assumeModelExists: true
});

// Note: Capability checks are bypassed (assumed true) for custom models.
await chat.ask("Hello");
```

### Custom Endpoints (e.g. Azure/Local)

To point to a custom URL (like an Azure endpoint or local proxy), configure the base URL globally.

```ts
const llm = createLLM({
  openaiApiBase: "https://my-azure-resource.openai.azure.com",
  openaiApiKey: process.env.AZURE_API_KEY
});

// Now valid for all OpenAI requests
const chat = llm.chat("gpt-4", { provider: "openai" });
```
