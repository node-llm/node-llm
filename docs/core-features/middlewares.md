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
import { NodeLLM, Middleware, ChatResponseString } from "@node-llm/core";

const myMiddleware: Middleware = {
  name: "MyMiddleware",
  onRequest: async (context) => {
    console.log(`[Request] Sending to ${context.model}`);
  },
  onResponse: async (context, result) => {
    // result is NodeLLMResponse (union of Chat, Image, Transcription, etc.)
    if (result instanceof ChatResponseString) {
      console.log(`[Response] Received ${result.usage.total_tokens} tokens`);
    }
  }
};

const chat = NodeLLM.chat("gpt-4o", {
  middlewares: [myMiddleware]
});

await chat.ask("Hello world");
```

---

## The Middleware Interface (v1.10.0+)
 
 A middleware consists of a unique name and several optional hooks that cover the entire lifecycle of an LLM request, including tool execution.
 
 ```typescript
 interface Middleware {
   name: string;
   onRequest?: (context: MiddlewareContext) => Promise<void> | void;
   onResponse?: (context: MiddlewareContext, result: NodeLLMResponse) => Promise<void> | void;
   onError?: (context: MiddlewareContext, error: Error) => Promise<void> | void;
   
   // Tool Execution Hooks
   onToolCallStart?: (context: MiddlewareContext, tool: ToolCall) => Promise<void> | void;
   onToolCallEnd?: (context: MiddlewareContext, tool: ToolCall, result: unknown) => Promise<void> | void;
   onToolCallError?: (context: MiddlewareContext, tool: ToolCall, error: Error) => Promise<ToolErrorDirective> | ToolErrorDirective;
 }
 ```

 > **Warning**: Since `v1.10.0`, the `onResponse` hook receives a `NodeLLMResponse` union. You must use a type guard (like `instanceof ChatResponseString`) before accessing chat-specific properties like `usage` or `content`.
 
 ### MiddlewareContext
 The `context` object is persistent across the lifecycle of a single request and provides deep access to the execution state:
 
 - `requestId`: A unique UUID for tracing the request.
 - `provider`: The provider name (e.g., "openai", "anthropic").
 - `model`: The model identifier.
 - `messages`: The conversation history (mutable in `onRequest`).
 - `options`: The `ChatOptions` for the request (mutable in `onRequest`).
 - `state`: A record for sharing data between hooks in the same middleware (e.g., storing a timer).
 - `metadata`: Custom metadata passed to the request.
 - **Operation Specifics**: `input` (Embeddings), `imageOptions` (Paint), etc.

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
  onRequest: async (context) => {
    context.state.startTime = Date.now();
  },
  onResponse: async (context, result) => {
    const latency = Date.now() - (context.state.startTime as number);
    
    // Safety check for usage metrics
    if (result instanceof ChatResponseString) {
      const cost = calculateCost(context.model, result.usage);
      await db.metrics.create({ model: context.model, latency, cost });
    }
  }
}
```

---

## Middleware Execution Order (v1.10.0+)

Middlewares are executed as a **stack** (Onion model). This ensures that outer middlewares (like loggers) can correctly wrap and observe the transformations made by inner middlewares (like security maskers).

- **onRequest**: Executed in order (first to last).
- **onToolCallStart**: Executed in order (first to last).
- **onToolCallEnd**: Executed in **REVERSE** order (last to first).
- **onToolCallError**: Executed in **REVERSE** order (last to first).
- **onResponse**: Executed in **REVERSE** order (last to first).
- **onError**: Executed in **REVERSE** order (last to first).

### Example Lifecycle
If you have two middlewares: `[Logger, Security]`, the execution order for a successful tool-calling request is:
1. `Logger.onRequest`
2. `Security.onRequest`
3. `Logger.onToolCallStart`
4. `Security.onToolCallStart`
5. ... Tool Execution ...
6. `Security.onToolCallEnd`
7. `Logger.onToolCallEnd`
8. `Security.onResponse`
9. `Logger.onResponse`

---

## Standard Middleware Library

NodeLLM includes a set of pre-built, production-ready middlewares that you can use out of the box.

### 1. PIIMaskMiddleware
Automatically redacts sensitive information like emails, phone numbers, and credit cards from user messages before they are sent to the LLM.

```typescript
import { NodeLLM, PIIMaskMiddleware } from "@node-llm/core";

const chat = NodeLLM.chat("gpt-4o", {
  middlewares: [new PIIMaskMiddleware({ mask: "[SECRET]" })]
});
```

### 2. CostGuardMiddleware
Monitors accumulated cost during a session (especially useful for multi-turn tool calling loops) and throws an error if a defined budget is exceeded.

```typescript
import { NodeLLM, CostGuardMiddleware } from "@node-llm/core";

const chat = NodeLLM.chat("gpt-4o", {
  middlewares: [
    new CostGuardMiddleware({ 
      maxCost: 0.05, // $0.05 budget
      onLimitExceeded: (ctx, cost) => console.log(`Budget blown for ${ctx.requestId}`)
    })
  ]
});
```

### 3. UsageLoggerMiddleware
Standardizes telemetry by logging token usage, request IDs, and calculated costs for every successful interaction.

```typescript
import { NodeLLM, UsageLoggerMiddleware } from "@node-llm/core";

const chat = NodeLLM.chat("gpt-4o", {
  middlewares: [new UsageLoggerMiddleware({ prefix: "MY-APP" })]
});
```

---

## Global Middlewares

You can also register middlewares at the global level when creating the LLM instance. These will be applied to **every** chat, embedding, or image generation call made from that instance.

```typescript
import { createLLM, UsageLoggerMiddleware } from "@node-llm/core";

const llm = createLLM({
  provider: "openai",
  middlewares: [new UsageLoggerMiddleware()]
});

// This chat will automatically use the global UsageLoggerMiddleware
const chat = llm.chat("gpt-4o");
```

---

## Integration with @node-llm/orm

When using the ORM, you can pass middlewares directly to the `createChat` call. They will be applied to the underlying chat instance but will NOT be persisted to the database.

```typescript
import { createChat } from "@node-llm/orm/prisma";

const chat = await createChat(prisma, llm, {
  model: "gpt-4o",
  middlewares: [new UsageLoggerMiddleware()]
});
```
