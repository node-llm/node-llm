---
layout: default
title: Reasoning
parent: Core Features
nav_order: 10
---

# Reasoning

`NodeLLM` provides a unified way to access the "thinking" or "reasoning" process of models like **DeepSeek R1** or **OpenAI o1/o3**. Some models expose their internal chain of thought before providing the final answer.

## Accessing Reasoning Content

For models that support it (like `deepseek-reasoner`), you can access the reasoning text via the `.reasoning` property on the response object.

```ts
import { NodeLLM } from "@node-llm/core";

const chat = NodeLLM.chat("deepseek-reasoner");
const response = await chat.ask("Prove that the square root of 2 is irrational.");

// Show the inner thought process
console.log("Thinking:", response.reasoning);

// Show the final answer
console.log("Answer:", response.content);
```

### Streaming Reasoning

When using `.stream()`, reasoning content is emitted as chunks, just like regular content. You can distinguish them by checking `chunk.reasoning`.

```ts
const chat = NodeLLM.chat("deepseek-reasoner");

for await (const chunk of chat.stream("Explain quantum entanglement")) {
  if (chunk.reasoning) {
    process.stdout.write(`[Thinking] ${chunk.reasoning}`);
  }
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

The final response object in the `onEndMessage` callback or returned by the stream will also contain the full aggregated reasoning string.

## OpenAI o1/o3 Support

OpenAI models like `o3-mini` do not expose the reasoning text directly (in a separate field), but they use "reasoning tokens" during generation. `NodeLLM` automatically tracks these tokens and includes them in the usage and cost calculations.

```ts
const chat = NodeLLM.chat("o3-mini");
const response = await chat.ask("Write a complex algorithm");

console.log(`Reasoning tokens used: ${response.usage.output_tokens}`);
console.log(`Total cost: $${response.cost}`);
```

## Supported Models

Currently, the following models have enhanced reasoning support in `NodeLLM`:

| Model ID | Provider | Feature |
| :--- | :--- | :--- |
| `deepseek-reasoner` | DeepSeek | Full thinking text extraction |
| `o1-preview`, `o1-mini`, `o3-mini` | OpenAI | Reasoning token & cost tracking |
