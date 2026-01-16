---
layout: default
title: Parallel Execution
parent: Advanced
nav_order: 10
description: Learn how to safely run multiple LLM providers concurrently using NodeLLM’s scoped context system to avoid global state race conditions.
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

## The Problem

In previous versions, `NodeLLM` was a mutable singleton. Calling `NodeLLM.configure()` concurrently could lead to race conditions where one request would overwrite the configuration of another.

## The Solution

As of v1.6.0, `NodeLLM` is a **frozen, immutable instance**. It cannot be mutated at runtime. For parallel execution with different providers or configurations, you use **context branching** via `.withProvider()` or create independent instances via `createLLM()`.

---

## How to use it

### 1. Simple Parallel Calls

The most elegant way to run multiple providers is using `.withProvider()`. This creates a scoped, isolated instance for that specific call.

```javascript
import { NodeLLM } from "@node-llm/core";

const [score1, score2, score3] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3-5-sonnet").ask(prompt),
  NodeLLM.withProvider("gemini").chat("gemini-2.0-flash").ask(prompt)
]);
```

## Benefits

✅ **Singleton maintained**: No need to use `new NodeLLM()` unless you want to.  
✅ **Race condition solved**: Each `.withProvider()` call creates an isolated context.  
✅ **Clean syntax**: Chaining `.withProvider().chat().ask()` is intuitive and elegant.  
✅ **Automatic key sharing**: Scoped instances inherit the global API keys by default.

## Example

Check out `examples/parallel-scoring-clean.mjs` for a working demonstration.
