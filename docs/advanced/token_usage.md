---
layout: default
title: Token Usage
parent: Advanced
nav_order: 5
description: Monitor costs and resource consumption by tracking input/output tokens and estimated spend for individual requests or entire chat sessions.
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

Track tokens for individual turns or the entire conversation to monitor costs and usage.

## Per-Response Usage

Every response object contains usage metadata for that specific interaction.

const response = await chat.ask("Hello!");

// Standard Snake Case
console.log(response.input_tokens); 

// Modern Camel Case Alias <span style="background-color: #0d47a1; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.6.0</span>
console.log(response.inputTokens); 

// Full Metadata Object (Perfect for DB storage) <span style="background-color: #0d47a1; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.6.0</span>
console.log(response.meta); 
// => { usage: {...}, model: "...", provider: "...", reasoning: "..." }
```

## Session Totals

The `Chat` instance maintains a running total of usage for the life of that object.

```ts
// Access aggregated usage for the whole session
console.log(chat.totalUsage.total_tokens);
console.log(chat.totalUsage.cost);
```
