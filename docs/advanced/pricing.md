---
layout: default
title: Model Pricing
parent: Advanced
nav_order: 4
description: Learn how to manage, override, and fetch LLM pricing data in NodeLLM.
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

NodeLLM comes with built-in pricing data for over 9,000 models, updated weekly from [models.dev](https://models.dev). However, you may need to override these prices for custom contracts, handle new models before they enter our registry, or manage pricing for local/custom providers.

## The Pricing Registry

All pricing logic is managed by the `PricingRegistry`. This registry uses a tiered lookup strategy to determine the cost of a model:

1.  **Runtime Overrides**: Manual registrations or remote updates.
2.  **Expert Patterns**: Hardcoded library patterns for specific model families (e.g., Claude 3.7 reasoning).
3.  **Static Registry**: The default values from our weekly-updated `models.ts`.

### Runtime Overrides

You can manually register pricing for any model at runtime. This is particularly useful for custom providers or private deployments.

```ts
import { PricingRegistry } from "@node-llm/core";

PricingRegistry.register("mistral", "mistral-large-latest", {
  text_tokens: {
    standard: {
      input_per_million: 2.0,
      output_per_million: 6.0
    }
  }
});
```

### Remote Updates

For dynamic pricing management without code changes, you can fetch updates from a remote JSON endpoint.

```ts
await PricingRegistry.fetchUpdates("https://api.yourcompany.com/llm-pricing.json");
```

The JSON format should match:
```json
{
  "models": {
    "openai/gpt-5": {
      "text_tokens": {
        "standard": { "input_per_million": 1.0, "output_per_million": 5.0 }
      }
    }
  }
}
```

## Custom Providers

Custom providers (e.g., local instances of LLMs or internal proxies) can define their own pricing logic.

### Registering the Model
First, ensure the model exists in the `ModelRegistry` so NodeLLM knows its context window and capabilities.

```ts
import { ModelRegistry } from "@node-llm/core";

ModelRegistry.save({
  id: "local-llama",
  name: "Local Llama 3",
  provider: "local",
  context_window: 8192,
  capabilities: ["chat", "streaming"],
  modalities: { input: ["text"], output: ["text"] }
});
```

### Registering the Price
Then, assign it a price in the `PricingRegistry`.

```ts
import { PricingRegistry } from "@node-llm/core";

PricingRegistry.register("local", "local-llama", {
  text_tokens: {
    standard: {
      input_per_million: 0.0, // Free local model
      output_per_million: 0.0
    }
  }
});
```

## Cost Calculation

NodeLLM automatically calculates costs when a `usage` object is returned by a provider. You can also perform manual calculations using the registry:

```ts
import { ModelRegistry } from "@node-llm/core";

const usage = {
  input_tokens: 1000,
  output_tokens: 500,
  total_tokens: 1500
};

const costInfo = ModelRegistry.calculateCost(usage, "gpt-4o", "openai");
console.log(costInfo.cost); // Total cost in USD
```

## Advanced: Reasoning & Batch Pricing

For models that support specialized features, you can define more granular pricing:

```ts
PricingRegistry.register("openai", "o1-preview", {
  text_tokens: {
    standard: {
      input_per_million: 15.0,
      output_per_million: 60.0,
      reasoning_output_per_million: 60.0, // Specific reasoning cost
      cached_input_per_million: 7.50     // Discounted cache read
    },
    batch: {
      input_per_million: 7.50,
      output_per_million: 30.0
    }
  }
});
```
