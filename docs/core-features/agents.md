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

| Method | Description |
|:-------|:------------|
| `ask(prompt)` | Send a message and get a response |
| `say(prompt)` | Alias for `ask()` |
| `stream(prompt)` | Stream the response |

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

The "research then write" pattern with specialized agents:

```typescript
import { Agent, Tool, z, createLLM } from "@node-llm/core";

class ResearchAgent extends Agent {
  static model = "gemini-2.0-flash";
  static instructions = "List 5 key facts about the topic.";
}

class WriterAgent extends Agent {
  static model = "claude-sonnet-4-20250514";
  static instructions = "Write a concise article from these notes.";
}

class ResearcherTool extends Tool {
  name = "research";
  description = "Gathers facts about a topic";
  schema = z.object({ topic: z.string() });

  async execute({ topic }) {
    const researcher = new ResearchAgent({ llm: createLLM({ provider: "gemini" }) });
    return await researcher.ask(topic);
  }
}

class WriterTool extends Tool {
  name = "write";
  description = "Writes content from research notes";
  schema = z.object({ notes: z.string() });

  async execute({ notes }) {
    const writer = new WriterAgent({ llm: createLLM({ provider: "anthropic" }) });
    return await writer.ask(notes);
  }
}

class CoordinatorAgent extends Agent {
  static model = "gpt-4o";
  static instructions = "First research the topic, then write an article.";
  static tools = [ResearcherTool, WriterTool];
}

const llm = createLLM({ provider: "openai" });
const coordinator = new CoordinatorAgent({ llm });
await coordinator.ask("Write about TypeScript 5.4 features");
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

## Next Steps

- [Tool Calling Guide](tools.html) — Deep dive on tool patterns and safety
- [Agentic Workflows](../advanced/agentic-workflows.html) — Advanced patterns like parallel execution and supervisor patterns
- [HR Chatbot RAG](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag) — Full RAG implementation
