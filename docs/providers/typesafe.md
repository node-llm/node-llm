---
layout: default
title: TypeSafe (Jev)
parent: Providers
nav_order: 11
description: TypeSafe's System One models (Jev) answer typed questions with calibrated probabilities. They power NodeLLM judgments.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.18.0+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Jev models do not generate text. They take an input and a set of typed questions and return a probability, a choice, or a score for each. NodeLLM uses them for [Judgments](/core-features/judgments); chat and the other operations are not available on this provider.

---

## Configuration

```bash
TYPESAFE_API_KEY=...   # JEV_API_KEY is accepted too
```

```ts
import { NodeLLM, probability } from "@node-llm/core";

// Jev models route to TypeSafe automatically, from any instance.
const judgment = await NodeLLM.judge("The site is down.", {
  questions: { urgent: probability("Does this need attention today?") }
});
```

Or scope an instance explicitly:

```ts
const typesafe = NodeLLM.withProvider("typesafe", {
  typesafeApiKey: process.env.TYPESAFE_API_KEY
});
```

---

## Models

| Model | |
|:--|:--|
| `jev-latest` | Default. TypeSafe's current System One model |
| `jev-preview` | A preview of the next `jev-latest` |

`judgment.model` reports the exact model that answered (for example `jev-1.13.0`). `listModels()` returns the live catalog.

---

## Jev-compatible servers

Any server implementing the System One API (`POST /v1/systemone`) can stand in for TypeSafe:

```ts
const local = NodeLLM.withProvider("typesafe", {
  typesafeApiBase: "http://localhost:8001",
  typesafeApiKey: "local"
});

await local.judge(input, { questions, model: "my-local-jev" });
```

---

## Errors

TypeSafe errors map to NodeLLM's error classes: an invalid request or unknown model is a `BadRequestError`, a bad key an `AuthenticationError`, and a rate limit a `RateLimitError` carrying `retryAfter` when the server sends one.

---

## Pricing

$0.042 per million input tokens; output is free. `judgment.usage` reports `input_cost`, `output_cost` (always 0) and `cost`. Models without known pricing, such as one on a local server, report tokens but leave `cost` undefined.
