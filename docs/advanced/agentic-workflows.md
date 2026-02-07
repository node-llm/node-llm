---
layout: default
title: Agentic Workflows
nav_order: 2
parent: Advanced
permalink: /advanced/agentic-workflows
description: Compose LLM calls into intelligent workflows that route, research, and collaborate.
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

This guide covers advanced agentic patterns for when you need more control than the [Agent class](../core-features/agents.html) provides. For most use cases, start with the Agent class first.

---

## Lower-Level Patterns

For cases where you need more control, you can build agents as tools that call other LLMs directly.

```typescript
import { Tool, z, createLLM } from "@node-llm/core";

class MathTutor extends Tool {
  name = "math_tutor";
  description = "Explains math concepts";
  schema = z.object({ question: z.string() });

  async execute({ question }) {
    const response = await createLLM({ provider: "openai" })
      .chat("gpt-4o")
      .system("You are a math tutor. Explain concepts clearly.")
      .ask(question);
    return response.content;
  }
}

// Use as a tool in a coordinator
const llm = createLLM({ provider: "openai" });
const chat = llm.chat("gpt-4o").withTool(MathTutor);
await chat.ask("Help me understand calculus");
```

---

## Parallel Execution

Node.js is async-native. Use `Promise.all()` to run independent LLM calls concurrently.

```typescript
import { createLLM } from "@node-llm/core";

async function analyzeContent(text: string) {
  const llm = createLLM({ provider: "openai" });

  const [sentiment, summary, topics] = await Promise.all([
    llm.chat("gpt-4o-mini").ask(`Sentiment (positive/negative/neutral): ${text}`),
    llm.chat("gpt-4o-mini").ask(`One-sentence summary: ${text}`),
    llm.chat("gpt-4o-mini").ask(`Extract 3 topics: ${text}`)
  ]);

  return {
    sentiment: sentiment.content,
    summary: summary.content,
    topics: topics.content
  };
}
```

---

## Supervisor Pattern

Run specialized reviewers in parallel, then synthesize their findings:

```typescript
import { createLLM } from "@node-llm/core";

async function reviewCode(code: string) {
  // Parallel specialist reviews
  const [security, performance] = await Promise.all([
    createLLM({ provider: "anthropic" })
      .chat("claude-sonnet-4-20250514")
      .system("Security review. List vulnerabilities.")
      .ask(code),
    createLLM({ provider: "openai" })
      .chat("gpt-4o")
      .system("Performance review. List bottlenecks.")
      .ask(code)
  ]);

  // Synthesize
  return createLLM({ provider: "openai" })
    .chat("gpt-4o")
    .system("Combine these reviews into actionable recommendations.")
    .ask(`Security:\n${security.content}\n\nPerformance:\n${performance.content}`);
}
```

---

## Error Handling in Agents

Agents should handle failures gracefully. See the [Tools guide](../core-features/tools.html#error-handling--flow-control-) for details.

```typescript
class RiskyTool extends Tool {
  async execute(args) {
    // Recoverable: return error for LLM to retry
    if (!args.query) {
      return { error: "Query is required" };
    }

    // Fatal: stop the entire agent loop
    if (args.query.includes("DROP TABLE")) {
      throw new ToolError("Blocked dangerous query", this.name, true);
    }

    return await this.doWork(args);
  }
}
```

---

## Next Steps

- [Agent Class Guide](../core-features/agents.html) — The recommended way to build agents with a declarative DSL
- [HR Chatbot RAG](https://github.com/node-llm/node-llm/tree/main/examples/applications/hr-chatbot-rag) — Full RAG implementation with Prisma + pgvector
- [Brand Perception Checker](https://github.com/node-llm/node-llm/tree/main/examples/applications/brand-perception-checker) — Multi-tool agent with web search
- [Tool Calling Guide](../core-features/tools.html) — Deep dive on tool patterns and safety
