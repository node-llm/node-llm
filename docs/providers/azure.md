---
layout: default
title: Azure OpenAI
parent: Providers
nav_order: 12
description: OpenAI models deployed on your own Azure OpenAI resource, with chat, streaming and tool calling.
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

The Azure provider talks to OpenAI models deployed on an Azure OpenAI resource. Requests are signed with the resource's key (the `api-key` header) and go to your deployment, so they stay within your Azure tenant and region.

---

## Configuration

Give it the deployment's address, as Azure shows it under **Endpoint** (including `api-version`), and the resource's key:

```ts
import { createLLM } from "@node-llm/core";

const llm = createLLM({
  provider: "azure",
  azureApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureApiBase:
    "https://my-resource.openai.azure.com/openai/deployments/my-gpt-6-luna?api-version=2025-04-01-preview"
});

const chat = llm.chat("gpt-6-luna");
```

Or via environment variables:

```env
NODELLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_API_BASE=https://my-resource.openai.azure.com/openai/deployments/my-gpt-6-luna?api-version=2025-04-01-preview
```

### The model name

With a deployment's address, the address decides which deployment answers. Pass the **model the deployment runs** (such as `gpt-6-luna`) as the model, not the deployment's name: NodeLLM uses it to know the model's capabilities and to price each request.

You can also give the resource's v1 address, `https://my-resource.openai.azure.com/openai/v1`. Then the model is the deployment's name, as with OpenAI's own SDK; capabilities and pricing are only known when the deployment is named after its model.

---

## Tool calling on newer models

GPT-5.6 and GPT-6 models take function tools only through the Responses API. As on [OpenAI](openai.md), NodeLLM sends those requests, and only those, to the Responses API: on Azure that is the resource's `/openai/v1/responses`, naming your deployment. Everything else uses Chat Completions on the deployment.

---

## Supported features

| Feature | Supported |
|:---|:---|
| Chat and streaming | ✅ |
| Tool calling | ✅ |
| Listing models | ❌ (Azure lists deployments in the Azure portal) |
