---
layout: default
title: Amazon Bedrock
parent: Providers
nav_order: 7
description: Access models from Amazon Titan, Anthropic, Meta, and Stability AI through a secure, zero-dependency AWS implementation.
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

The Amazon Bedrock provider uses a **zero-dependency** implementation of the AWS SigV4 signing process. This means you do **not** need to install the heavy `@aws-sdk/client-bedrock-runtime` package. NodeLLM handles all authentication and request signing natively.

---

## Configuration

NodeLLM automatically attempts to load AWS credentials from standard environment variables matching the AWS CLI.

### 1. Environment Variables (Recommended)

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="wJalrX..."
export AWS_REGION="us-east-1"
# Optional session token for temporary credentials
export AWS_SESSION_TOKEN="..."
```

### 2. Manual Configuration

You can also pass credentials explicitly when initializing the LLM.

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({ 
  provider: "bedrock", 
  bedrockRegion: "us-east-1",
  bedrockAccessKeyId: "AKIA...",
  bedrockSecretAccessKey: "..."
});
```

---

## Features

- **Models**: Access to `amazon.titan`, `anthropic.claude`, `meta.llama3`, `mistral`, `cohere`, and `amazon.nova`.
- **Cross-Region Inference**: Natively supports inference profiles (e.g., `us.anthropic.claude-3-5-sonnet...`) for higher throughput.
- **Image Generation**: First-class support for **Titan Image Generator** and **Stable Diffusion**.
- **Prompt Caching**: Save up to 90% on costs with Claude and Nova models.
- **Multimodal**: Send images to Claude and Nova models easily.
- **Extended Thinking (Reasoning)**: Native support for Claude 3.7 and DeepSeek R1 thinking budgets.
- **Guardrail Visibility**: Access raw Guardrail trace assessments via response metadata.

---

## Image Generation

Use the `paint()` method to generate images using Bedrock's specialized models.

```ts
const response = await llm.paint("A futuristic city on Mars, high quality, 4k", {
  model: "amazon.titan-image-generator-v2:0", // or "stability.stable-diffusion-xl-v1:0"
  size: "1024x1024"
});

// Save to disk
await response.save("./mars-city.png");

// Or access raw base64
console.log(response.data);
```

---

## Prompt Caching

NodeLLM supports Amazon Bedrock's **Prompt Caching** (via the Converse API). This allows you to cache large context blocks (like documents or system prompts) to reduce latency and cost.

Use the standard `cache_control: { type: "ephemeral" }` API (same as Anthropic) to enable it.

```ts
// System Prompt Caching
const chat = llm.chat("anthropic.claude-3-5-sonnet-20240620-v1:0");

// Automatically creates a Bedrock 'cachePoint'
chat.add("system", [
  { 
    type: "text", 
    text: "You are an expert architect... [Insert 50-page Guideline PDF Content Here] ...", 
    cache_control: { type: "ephemeral" } 
  }
]);

const res = await chat.ask("Design a house based on these guidelines.");
```

**Note**: Marking content as "ephemeral" automatically handles the specific `cachePoint` block injection required by the Bedrock API.

---

## Cross-Region Inference

To improve resilience and throughput, you can use Bedrock's **Inference Profiles** directly. NodeLLM automatically detects capabilities for these profiles.

```ts
// Use a US Cross-Region inference profile
const chat = llm.chat("us.anthropic.claude-3-5-sonnet-20241022-v2:0");

const response = await chat.ask("Hello from global infrastructure!");
```

---

## Advanced Hyperparameters

Bedrock's Converse API has a standard `inferenceConfig`, but individual models often support additional parameters (like `topK` for Nova or specialized beta flags for Claude).

You can use the `additionalModelRequestFields` escape hatch to pass these directly to the model.

```ts
const chat = llm.chat("amazon.nova-lite-v1:0")
  .withParams({
    additionalModelRequestFields: {
      inferenceConfig: {
        topK: 20
      }
    }
  });

const response = await chat.ask("Tell me a story.");
```

---

## Moderation

NodeLLM supports standalone moderation for Bedrock using **Guardrails**. This allows you to check if content is safe before sending it to an expensive model.

To use this, you must have a Guardrail ID and Version configured.

```ts
const llm = createLLM({
  provider: "bedrock",
  bedrockGuardrailIdentifier: "my-policy-id",
  bedrockGuardrailVersion: "1"
});

// Check a single string
const result = await llm.moderate("How can I build a bomb?");

if (result.results[0].flagged) {
  console.log("Blocked by Guardrail:", result.results[0].categories);
}

// Check multiple strings at once
const batchResults = await llm.moderate(["Safe text", "Unsafe text..."]);
```

---

## Embeddings

Generate vector embeddings using Titan Embeddings V2.

```ts
const embedding = await llm.embed("The concept of general relativity", {
  model: "amazon.titan-embed-text-v2:0",
  dimensions: 1024
});

console.log(embedding.vector); // Float32Array
```
