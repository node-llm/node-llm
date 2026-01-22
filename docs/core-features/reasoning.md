---
layout: default
title: Reasoning
parent: Core Features
nav_order: 10
description: Access the inner thoughts and chain-of-thought process of advanced reasoning models like DeepSeek R1 and OpenAI o1/o3.
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

`NodeLLM` provides a unified way to access the "thinking" or "reasoning" process of models like **DeepSeek R1**, **OpenAI o1/o3**, and **Claude 3.7/4**. Many models now expose their internal chain of thought or allow configuring the amount of effort spent on reasoning.

---

## Configuring Thinking

You can control the reasoning behavior using the `.withThinking()` or `.withEffort()` methods. This is particularly useful for models like `o3-mini` or `claude-3-7-sonnet`.

### Setting Effort Level
Effort levels (low, medium, high) allow you to balance between speed/cost and reasoning depth.

```ts
import { NodeLLM } from "@node-llm/core";

const chat = NodeLLM.chat("o3-mini")
  .withEffort("high"); // Options: "low", "medium", "high"

const response = await chat.ask("Solve this complex architecture problem...");
```

### Setting a Thinking Budget
For models like Claude 3.7, you can specify a token budget for thinking. The model will stop thinking once this budget is reached.

```ts
const chat = NodeLLM.chat("claude-sonnet-4-20250514")
  .withThinking({ budget: 2000 });

const response = await chat.ask("Analyze these logs...");
```

---

## Accessing Thinking Results

The results of thinking are available via the `.thinking` property on the response object. This unified object contains the text, tokens used, and any cryptographic signatures provided by the model.

```ts
const response = await chat.ask("Prove that the square root of 2 is irrational.");

// High-level access via response.thinking
if (response.thinking) {
  console.log("Thought Process:", response.thinking.text);
  console.log("Tokens Spent:", response.thinking.tokens);
  console.log("Verification Signature:", response.thinking.signature);
}

// Show the final answer
console.log("Answer:", response.content);
```

### Streaming Thinking

When using `.stream()`, thinking content is emitted in chunks. You can capture it by checking `chunk.thinking`.

```ts
const chat = NodeLLM.chat("deepseek-reasoner");

for await (const chunk of chat.stream("Explain quantum entanglement")) {
  if (chunk.thinking?.text) {
    process.stdout.write(`[Thinking] ${chunk.thinking.text}`);
  }
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

---

## Backward Compatibility (Deprecated)

Previously, reasoning text was accessed via the `response.reasoning` property. While still supported for backward compatibility, it is recommended to transition to the structured `response.thinking.text` API.

---

## Supported Capabilities

Currently, the following models have enhanced reasoning support in `NodeLLM`:

| Model ID                           | Provider  | Support Level                                     |
| :--------------------------------- | :-------- | :------------------------------------------------ |
| `deepseek-reasoner`                | DeepSeek  | Full text extraction                              |
| `o1-*`, `o3-*`                     | OpenAI    | Effort configuration & token tracking             |
| `claude-3-7-*`, `claude-*-4-*`     | Anthropic | Budget-based thinking & full text extraction      |
| `gemini-2.0-flash-thinking-*`      | Gemini    | Full thinking text extraction                     |
