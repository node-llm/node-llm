---
layout: default
title: Parallel Execution
nav_order: 10
parent: Advanced
---

# Multi-Provider Parallel Execution

## The Problem
`NodeLLM` is a singleton. When calling `NodeLLM.configure({ provider: '...' })` in parallel (e.g., inside `Promise.all`), one provider call could "overwrite" the provider for another call, leading to race conditions.

## The Solution
Added a `.withProvider()` method to `NodeLLM`. This returns a **scoped copy** of the LLM instance that is isolated from the global singleton state.

---

## How to use it

### 1. Configure once globally
```javascript
import { NodeLLM } from "@node-llm/core";

NodeLLM.configure((config) => {
  config.openaiApiKey = "...";
  config.anthropicApiKey = "...";
  config.geminiApiKey = "...";
});
```

### 2. Run in parallel safely
```javascript
const [score1, score2, score3] = await Promise.all([
  NodeLLM.withProvider("openai").chat("gpt-4o").ask(prompt),
  NodeLLM.withProvider("anthropic").chat("claude-3").ask(prompt),
  NodeLLM.withProvider("gemini").chat("gemini-2.0").ask(prompt),
]);
```

## Benefits
✅ **Singleton maintained**: No need to use `new NodeLLM()` unless you want to.  
✅ **Race condition solved**: Each `.withProvider()` call creates an isolated context.  
✅ **Clean syntax**: Chaining `.withProvider().chat().ask()` is intuitive and elegant.  
✅ **Automatic key sharing**: Scoped instances inherit the global API keys by default.

## Example
Check out `examples/parallel-scoring-clean.mjs` for a working demonstration.
