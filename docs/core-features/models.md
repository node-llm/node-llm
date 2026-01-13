---
layout: default
title: Models & Registry
nav_order: 6
parent: Core Features
---

# Models & Registry

`NodeLLM` includes a comprehensive, built-in registry of models using data from **models.dev**. This allows you to discover models and their capabilities programmatically.

## Inspecting a Model

You can look up any supported model to check its context window, costs, and features.

```ts
import { NodeLLM } from "@node-llm/core";

const model = NodeLLM.models.find("gpt-4o");

if (model) {
  console.log(`Provider: ${model.provider}`);
  console.log(`Context Window: ${model.context_window} tokens`);
  console.log(`Input Price: $${model.pricing.text_tokens.standard.input_per_million}/1M`);
  console.log(`Output Price: $${model.pricing.text_tokens.standard.output_per_million}/1M`);
}
```

## Discovery by Capability

You can filter the registry to find models that match your requirements.

### Finding Vision Models
```ts
const visionModels = NodeLLM.models.list().filter(m => 
  m.capabilities.includes("vision")
);

console.log(`Found ${visionModels.length} vision-capable models.`);
visionModels.forEach(m => console.log(m.id));
```

### Finding Tool-Use Models
```ts
const toolModels = NodeLLM.models.list().filter(m => 
  m.capabilities.includes("tools")
);
```

### Finding Audio Models
```ts
const audioModels = NodeLLM.models.list().filter(m => 
  m.capabilities.includes("audio_input")
);
```

## Supported Providers

The registry includes models from:
*   **OpenAI** (GPT-4o, GPT-3.5, DALL-E)
*   **Anthropic** (Claude 3.5 Sonnet, Haiku, Opus)
*   **Google Gemini** (Gemini 1.5 Pro, Flash)
*   **Vertex AI** (via Gemini)

## Custom Models & Endpoints

Sometimes you need to use models not in the registry, such as **Azure OpenAI** deployments, **Local Models** (Ollama/LM Studio), or brand new releases.

### Using `assumeModelExists`
This flag tells `NodeLLM` to bypass the registry check.

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
NodeLLM.configure({
  openaiApiBase: "https://my-azure-resource.openai.azure.com",
  openaiApiKey: process.env.AZURE_API_KEY
});

// Now valid for all OpenAI requests
const chat = NodeLLM.chat("gpt-4", { provider: "openai" });
```
