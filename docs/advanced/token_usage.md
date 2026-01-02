---
layout: default
title: Token Usage
nav_order: 5
parent: Advanced
---

# Token Usage Tracking

Track tokens for individual turns or the entire conversation to monitor costs and usage.

## Per-Response Usage

Every response object contains usage metadata for that specific interaction.

```ts
const response = await chat.ask("Hello!");

console.log(response.input_tokens);  // e.g. 10
console.log(response.output_tokens); // e.g. 5
console.log(response.cost);          // Estimated cost in USD
```

## Session Totals

The `Chat` instance maintains a running total of usage for the life of that object.

```ts
// Access aggregated usage for the whole session
console.log(chat.totalUsage.total_tokens);
console.log(chat.totalUsage.cost);
```
