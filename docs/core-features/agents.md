---
layout: default
title: Agents
nav_order: 6
parent: Core Features
permalink: /core-features/agents
description: Build intelligent agents with a declarative class-based DSL for model routing, RAG, multi-agent collaboration, and more.
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

The `Agent` class provides a declarative way to define reusable agents with static configuration. This is inspired by Ruby on Rails' class macros and provides a clean DSL for agent definition.

```bash
npm install @node-llm/core
```

---

## Basic Usage <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.11.0+</span>

Define agents using static properties on a class:

```typescript
import { Agent, createLLM } from "@node-llm/core";

// Define an agent with static properties
class AssistantAgent extends Agent {
  static model = "gpt-4o";
  static instructions = "You are a helpful assistant. Be concise.";
  static temperature = 0.7;
}

// Create and use
const llm = createLLM({ provider: "openai" });
const agent = new AssistantAgent({ llm });
const response = await agent.ask("What is the capital of France?");
```


### Agent Methods

**Instance Methods:**

| Method | Description |
|:-------|:------------|
| `ask(prompt)` | Send a message and get a response |
| `say(prompt)` | Alias for `ask()` |
| `stream(prompt)` | Stream the response |

**Static Methods** <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.11.0+</span>

| Method | Description |
|:-------|:------------|
| `Agent.ask(prompt)` | One-liner execution (creates instance automatically) |
| `Agent.stream(prompt)` | One-liner streaming |

```typescript
// Static API (one-liner)
const result = await AssistantAgent.ask("What is TypeScript?");

// Instance API (traditional)
const agent = new AssistantAgent({ llm });
const result = await agent.ask("What is TypeScript?");
```

### Available Static Properties

| Property | Type | Description |
|:---------|:-----|:------------|
| `model` | `string` | The model ID to use (e.g., "gpt-4o") |
| `instructions` | `string` | System prompt for the agent |
| `tools` | `Tool[]` | Array of Tool classes to register |
| `temperature` | `number` | Sampling temperature (0-2) |
| `thinking` | `boolean \| object` | Enable extended thinking (Claude) |
| `schema` | `ZodSchema` | Output schema for structured responses |

---

## Agents with Tools

Register tools on an agent class:

```typescript
import { Agent, Tool, z, createLLM } from "@node-llm/core";

class CalculatorTool extends Tool {
  name = "calculator";
  description = "Performs arithmetic operations";
  schema = z.object({
    a: z.number(),
    b: z.number(),
    operation: z.enum(["add", "subtract", "multiply", "divide"])
  });

  async execute({ a, b, operation }) {
    const ops = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b };
    return { result: ops[operation] };
  }
}

class MathAgent extends Agent {
  static model = "gpt-4o";
  static instructions = "Use the calculator tool to solve math problems.";
  static tools = [CalculatorTool];
  static temperature = 0;
}

const llm = createLLM({ provider: "openai" });
const agent = new MathAgent({ llm });
await agent.ask("What is 15 multiplied by 7?"); // Uses the tool automatically
```

---

## Model Routing Agent

Route requests to the best model for the job:

```typescript
import { Agent, Tool, z, createLLM } from "@node-llm/core";

class ClassifierTool extends Tool {
  name = "classify_task";
  description = "Classifies the task type";
  schema = z.object({ query: z.string() });

  async execute({ query }) {
    const response = await createLLM({ provider: "openai" })
      .chat("gpt-4o-mini")
      .system("Classify as: code, creative, or factual. One word only.")
      .ask(query);
    return { taskType: response.content.toLowerCase().trim() };
  }
}

class SmartRouter extends Agent {
  static model = "gpt-4o";
  static instructions = "Classify the task, then route to the appropriate specialist.";
  static tools = [ClassifierTool];
}

const llm = createLLM({ provider: "openai" });
const router = new SmartRouter({ llm });
await router.ask("Write a poem about the ocean");
```

---

## RAG Agent (Retrieval-Augmented Generation)

Combine vector search with LLM generation:

```typescript
import { Agent, Tool, z, createLLM } from "@node-llm/core";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class KnowledgeSearchTool extends Tool {
  name = "search_knowledge";
  description = "Searches internal documents for relevant context";
  schema = z.object({ query: z.string().describe("What to search for") });

  async execute({ query }) {
    const embedding = await createLLM({ provider: "openai" }).embed(query);
    const docs = await prisma.$queryRaw`
      SELECT title, content FROM documents
      ORDER BY embedding <-> ${embedding.vector}::vector LIMIT 3
    `;
    return docs.map(d => `[${d.title}]: ${d.content}`).join("\n\n");
  }
}

class RAGAgent extends Agent {
  static model = "gpt-4o";
  static instructions = "Answer questions using the knowledge search tool. Cite sources.";
  static tools = [KnowledgeSearchTool];
}

const llm = createLLM({ provider: "openai" });
const agent = new RAGAgent({ llm });
await agent.ask("What's our vacation policy?");
```

See the [HR Chatbot Example](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag) for a complete RAG implementation.

---

## Multi-Agent Collaboration

Compose specialized agents for complex workflows:

```typescript
import { Agent, createLLM } from "@node-llm/core";

class ResearchAgent extends Agent {
  static model = "gemini-2.0-flash";
  static instructions = "List 5 key facts about the topic. Be concise.";
}

class WriterAgent extends Agent {
  static model = "claude-sonnet-4-20250514";
  static instructions = "Write a compelling article from the provided research notes.";
}

// Orchestrator: directly coordinates sub-agents
async function researchAndWrite(topic: string) {
  // Step 1: Research
  const researcher = new ResearchAgent({ 
    llm: createLLM({ provider: "gemini" }) 
  });
  const facts = await researcher.ask(`Research: ${topic}`);
  
  // Step 2: Write
  const writer = new WriterAgent({ 
    llm: createLLM({ provider: "anthropic" }) 
  });
  const article = await writer.ask(`Write an article from these facts:\n\n${facts}`);
  
  return article;
}

// Usage
const result = await researchAndWrite("TypeScript 5.4 features");
console.log(result);
```

**Why not wrap in tools?** Direct orchestration is clearer when you control the workflow. Use tools only when the LLM needs to decide *when* to call sub-agents dynamically.

```

---

## Structured Output

Agents support structured output via Zod schemas:

```typescript
import { Agent, z, createLLM } from "@node-llm/core";

const SentimentSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number(),
  keywords: z.array(z.string())
});

class SentimentAnalyzer extends Agent<z.infer<typeof SentimentSchema>> {
  static model = "gpt-4o";
  static instructions = "Analyze the sentiment of the given text.";
  static schema = SentimentSchema;
}

const llm = createLLM({ provider: "openai" });
const analyzer = new SentimentAnalyzer({ llm });
const result = await analyzer.ask("I love this product!");
console.log(result.parsed?.sentiment); // "positive"
```

---

## Inline Definition with `defineAgent()`

For quick one-off agents without creating a class:

```typescript
import { defineAgent, createLLM } from "@node-llm/core";

const QuickAgent = defineAgent({
  model: "gpt-4o-mini",
  instructions: "You are a helpful assistant.",
  temperature: 0
});

const llm = createLLM({ provider: "openai" });
const agent = new QuickAgent({ llm });
await agent.ask("Hello!");
```

---

## Agent Inheritance

Agents support class inheritance for specialization:

```typescript
class BaseAgent extends Agent {
  static model = "gpt-4o";
  static temperature = 0;
}

class CodeReviewer extends BaseAgent {
  static instructions = "Review code for bugs and suggest improvements.";
}

class SecurityReviewer extends BaseAgent {
  static instructions = "Review code for security vulnerabilities.";
}
```

---

## Instance Overrides

Override static properties at instantiation:

```typescript
const agent = new AssistantAgent({
  llm,
  temperature: 0.9,    // Override static temperature
  maxTokens: 500       // Add runtime options
});
```

---

## Telemetry Hooks <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.11.0+</span>

Agent telemetry hooks provide declarative observability for production agents. They enable debugging, cost auditing, latency tracking, and integration with monitoring systems—without cluttering your agent logic.

### Available Hooks

| Hook | When Fired | Use Cases |
|:-----|:-----------|:----------|
| `onStart(context)` | Agent session begins | Request logging, session initialization |
| `onThinking(thinking, result)` | Model generates reasoning trace | Debug extended thinking (o1, Claude) |
| `onToolStart(toolCall)` | Tool execution starts | Latency tracking, audit trails |
| `onToolEnd(toolCall, result)` | Tool execution completes | Performance metrics, result logging |
| `onToolError(toolCall, error)` | Tool execution fails | Error tracking, alerting |
| `onComplete(result)` | Agent turn finishes | Cost logging, response analytics |

### Basic Example

```typescript
import { Agent, Tool, z } from "@node-llm/core";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather for a city";
  schema = z.object({ city: z.string() });

  async execute({ city }) {
    return `Sunny, 25°C in ${city}`;
  }
}

class ObservableAgent extends Agent {
  static model = "gpt-4o";
  static tools = [WeatherTool];
  
  static onStart(context) {
    console.log(`[Agent] Started with ${context.messages.length} messages`);
  }

  static onToolStart(toolCall) {
    console.log(`[Tool] ${toolCall.function.name} started`);
    console.time(`tool-${toolCall.id}`);
  }

  static onToolEnd(toolCall, result) {
    console.timeEnd(`tool-${toolCall.id}`);
  }

  static onComplete(result) {
    console.log(`[Agent] Complete. Tokens: ${result.total_tokens}`);
  }
}
```

### Production Monitoring

Track costs and latency in production:

```typescript
import { Agent } from "@node-llm/core";
import { metrics } from "./monitoring";

class ProductionAgent extends Agent {
  static model = "gpt-4o";
  
  static onStart(context) {
    metrics.increment("agent.requests");
  }

  static onToolError(toolCall, error) {
    metrics.increment(`tool.${toolCall.function.name}.errors`);
    console.error(`Tool ${toolCall.function.name} failed:`, error);
  }

  static onComplete(result) {
    metrics.gauge("agent.cost", result.usage.cost);
    metrics.gauge("agent.tokens", result.total_tokens);
  }
}
```

### Debug Extended Thinking

For models with extended thinking (o1, Claude):

```typescript
class ThinkingAgent extends Agent {
  static model = "o1-preview";
  static thinking = { effort: "high" };
  
  static onThinking(thinking, result) {
    console.log("🧠 Reasoning:", thinking.text);
    console.log(`Thinking tokens: ${thinking.tokens}`);
  }
}
```

### Async Hooks

All hooks support async operations:

```typescript
class AuditedAgent extends Agent {
  static model = "gpt-4o";
  
  static async onComplete(result) {
    await db.metrics.create({
      model: result.model,
      tokens: result.total_tokens,
      cost: result.usage.cost
    });
  }
}
```

---

## Agent Persistence with @node-llm/orm <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v0.5.0+</span>

For long-running agents that need to persist conversations across requests (e.g., support tickets, chat sessions), use `AgentSession` from `@node-llm/orm`.

```bash
npm install @node-llm/orm @prisma/client
```

### Create & Resume Sessions

```typescript
import { Agent, Tool, z, createLLM } from "@node-llm/core";
import { createAgentSession, loadAgentSession } from "@node-llm/orm/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const llm = createLLM({ provider: "openai" });

// Define agent (configuration lives in code)
class SupportAgent extends Agent {
  static model = "gpt-4.1";
  static instructions = "You are a helpful support agent.";
  static tools = [LookupOrderTool, CancelOrderTool];
}

// Create a persistent session
const session = await createAgentSession(prisma, llm, SupportAgent, {
  metadata: { userId: "user_123", ticketId: "TKT-456" }
});

await session.ask("Where is my order #789?");
console.log(session.id); // "abc-123" - save this to resume later

// Resume in a later request
const session = await loadAgentSession(prisma, llm, SupportAgent, "abc-123");
await session.ask("Can you cancel it?");
```

### The "Code Wins" Principle

When you resume a session, the agent uses **current code configuration** but **database history**:

| Aspect | Source | Rationale |
|:-------|:-------|:----------|
| Model | Agent class | Immediate upgrades when you deploy |
| Tools | Agent class | Only code can execute functions |
| Instructions | Agent class | Deploy prompt fixes immediately |
| History | Database | Sacred, never modified |

This means if you deploy an upgrade (new model, better prompt), all resumed sessions get the improvement automatically.

### Prisma Schema

Add `LlmAgentSession` to your schema:

```prisma
model LlmAgentSession {
  id         String   @id @default(uuid())
  agentClass String   // Validated on load (e.g., 'SupportAgent')
  chatId     String   @unique
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  chat       LlmChat  @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@index([agentClass])
  @@index([createdAt])
}

model LlmChat {
  // ... existing fields
  agentSession LlmAgentSession?
}
```

See the [@node-llm/orm documentation](https://node-llm.eshaiju.com/orm/prisma) for full details.

---

## Next Steps

- [Tool Calling Guide](tools.html) — Deep dive on tool patterns and safety
- [Agentic Workflows](../advanced/agentic-workflows.html) — Advanced patterns like parallel execution and supervisor patterns
- [HR Chatbot RAG](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag) — Full RAG implementation
