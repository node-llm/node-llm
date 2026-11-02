---
layout: default
title: Azure AI Foundry
parent: Providers
nav_order: 12
description: Every model deployed on your Azure resource, OpenAI's and others' such as Llama, DeepSeek, Mistral, Grok and Phi, with chat, streaming, tools, vision and embeddings.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.19.0+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The Azure provider talks to the models deployed on an Azure AI Foundry (or Azure OpenAI) resource, through Azure's OpenAI-compatible APIs. Requests go to your resource, so they stay within your Azure tenant and region.

---

## Configuration

Give it the address the Azure portal shows for your deployment or resource, and the resource's key:

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({
  provider: "azure",
  azureApiKey: process.env.AZURE_API_KEY,
  azureApiBase: "https://my-resource.services.ai.azure.com/openai/v1"
});

const chat = llm.chat("my-deepseek"); // the deployment's name
```

Or via environment variables:

```env
NODELLM_PROVIDER=azure
AZURE_API_KEY=...
AZURE_API_BASE=https://my-resource.services.ai.azure.com/openai/v1
```

### The address

Any of the addresses the portal shows works:

| Address | Example |
|:---|:---|
| The resource's v1 address | `https://my-resource.services.ai.azure.com/openai/v1` |
| The resource itself | `https://my-resource.services.ai.azure.com` (Foundry's model inference) |
| A model endpoint | `https://my-resource.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview` |
| A deployment's address | `https://my-resource.openai.azure.com/openai/deployments/my-gpt?api-version=2025-04-01-preview` |
| A serverless endpoint | `https://my-llama.eastus2.models.ai.azure.com/chat/completions` |

With a deployment's address, the address decides which deployment answers. With any other, the model you pass is the deployment's name.

### Signing in without a key

Resources that turn key sign-in off take a Microsoft Entra ID token instead:

```ts
const llm = createLLM({
  provider: "azure",
  azureAuthToken: process.env.AZURE_AUTH_TOKEN,
  azureApiBase: "https://my-resource.services.ai.azure.com/openai/v1"
});
```

The token is used as given; get a new one before it expires.

---

## Deployment names

On Azure you choose each deployment's name. When it is the model's own name, such as `gpt-4o` or `DeepSeek-V3.2`, NodeLLM knows the model's capabilities and price. When it isn't, say which model each deployment runs:

```ts
const llm = createLLM({
  provider: "azure",
  azureApiKey: process.env.AZURE_API_KEY,
  azureApiBase: "https://my-resource.services.ai.azure.com/openai/v1",
  azureDeployments: { "team-llama": "llama-3.3-70b-instruct" }
});

const response = await llm.chat("team-llama").ask("Hello");
console.log(response.usage.cost); // priced as llama-3.3-70b-instruct
```

A deployment NodeLLM doesn't know is assumed able to chat, call tools and return structured output: Azure itself refuses what the model can't do.

---

## Features

- **Models**: every model a resource deploys, OpenAI's (GPT, o-series) and others' (Llama, DeepSeek, Mistral, Grok, Phi, Kimi).
- **Chat and streaming**: on every chat model.
- **Tools**: on models that call tools. GPT-5.6 and GPT-6 take function tools only through the Responses API; as on [OpenAI](openai.md), NodeLLM sends those requests, and only those, to the resource's `/openai/v1/responses`, naming your deployment.
- **Structured output**: JSON schema and JSON mode, where the model supports them.
- **Vision**: images on vision models such as `gpt-4o`.
- **Embeddings**: through an embedding deployment, such as `text-embedding-3-small`.
- **Listing models**: `llm.listModels()` lists the models the resource's region offers, which you can deploy.

Not yet supported on Azure: image generation, transcription, moderation, Cohere's embed and rerank APIs, and Claude models, which Azure serves through Anthropic's API.

---

## Embeddings Example

```ts
const llm = createLLM({
  provider: "azure",
  azureApiKey: process.env.AZURE_API_KEY,
  azureApiBase: "https://my-resource.services.ai.azure.com/openai/v1"
});

const result = await llm.embed("Hello world", { model: "text-embedding-3-small" });
console.log(result.vectors[0]);
```

---

## Getting a key

Create a resource and deploy a model in the [Azure AI Foundry portal](https://ai.azure.com). The resource's key and addresses are on its overview page.
