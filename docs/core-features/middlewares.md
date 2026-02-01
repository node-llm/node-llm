---
layout: default
title: Middlewares
parent: Core Features
nav_order: 13
permalink: /core-features/middlewares
description: Intercept and modify LLM requests and responses with production-grade middlewares.
---

# Middlewares
{: .no_toc }

NodeLLM's middleware system allows you to intercept, monitor, and modify LLM interactions at the infrastructure level. This is essential for building production-grade systems that require observability, auditing, cost tracking, and safety.

1. TOC
{:toc}

---

## Why Middlewares?

In a production environment, you rarely want to call an LLM directly without additional logic. Middlewares allow you to separate these cross-cutting concerns from your business logic:

- **Observability**: Log requests, responses, and errors to external systems.
- **Cost Tracking**: Calculate and record the token usage and cost of every request.
- **Security & Compliance**: Redact PII (Personally Identifiable Information) before it segments to the LLM.
- **Auditing**: Maintain a permanent audit trail of all AI interactions.
- **Performance**: Track latency and success rates across different models.
- **Quality**: Automatically verify the integrity of the response.

---

## Basic Usage

Middlewares are passed when creating a chat instance. You can pass a single middleware or an array of middlewares.

```typescript
import { NodeLLM, Middleware } from "@node-llm/core";

const myMiddleware: Middleware = {
  name: "MyMiddleware",
  onRequest: async (context) => {
    console.log(`[Request] Sending to ${context.model}`);
  },
  onResponse: async (context, result) => {
    console.log(`[Response] Received ${result.usage.total_tokens} tokens`);
  }
};

const chat = NodeLLM.chat("gpt-4o", {
  middlewares: [myMiddleware]
});

await chat.ask("Hello world");
```

---

## The Middleware Interface

A middleware consists of a unique name and three optional hooks:

```typescript
interface Middleware {
  name: string;
  onRequest?: (context: MiddlewareContext) => Promise<void> | void;
  onResponse?: (context: MiddlewareContext, result: MiddlewareResult) => Promise<void> | void;
  onError?: (context: MiddlewareContext, error: Error) => Promise<void> | void;
}
```

### MiddlewareContext
The `context` object provides details about the request:
- `model`: The model being used.
- `provider`: The provider name (e.g., "openai", "anthropic").
- `requestId`: A unique ID for the request.
- `messages`: The conversation history (for chat operations).
- `metadata`: Any custom metadata passed to the request.

---

## Common Use Cases

### 1. PII Redaction (Security)
Redact sensitive information before it reaches the provider.

```typescript
const piiMiddleware = {
  name: "PIIRedactor",
  onRequest: async (context) => {
    context.messages.forEach(msg => {
      msg.content = msg.content.replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, "[REDACTED_CC]");
    });
  }
}
```

### 2. Cost & Performance Tracking
Use standard telemetry patterns to track your infrastructure.

```typescript
const perfMiddleware = {
  name: "PerformanceTracker",
  onResponse: async (context, result) => {
    const latency = result.meta.latency;
    const cost = calculateCost(context.model, result.usage);
    await db.metrics.create({ model: context.model, latency, cost });
  }
}
```

---

## Middleware Execution Order

Middlewares are executed as a stack:
- **onRequest**: Executed in the order they are defined (first to last).
- **onResponse**: Executed in the REVERSE order (last to first).
- **onError**: Executed in the REVERSE order (last to first).

This ensures that logging middlewares can wrap security middlewares correctly.

---

## Integration with @node-llm/orm

When using the ORM, you can pass middlewares directly to the `createChat` call. They will be applied to the underlying chat instance but will NOT be persisted to the database.

```typescript
import { createChat } from "@node-llm/orm/prisma";

const chat = await createChat(prisma, llm, {
  model: "gpt-4o",
  middlewares: [auditMiddleware, costMiddleware]
});
```
