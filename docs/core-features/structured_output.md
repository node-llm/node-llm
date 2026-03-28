---
layout: default
title: Structured Output
parent: Core Features
nav_order: 3
description: Force models to return strictly validated JSON data using Zod schemas or manual JSON definitions across all supported providers.
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

Ensure the AI returns data exactly matching a specific structure. `NodeLLM` supports strict schema validation using **Zod** (recommended) or manual JSON schemas.

This feature abstracts the provider-specific implementations (like OpenAI's `json_schema`, Gemini's `responseSchema`, or Anthropic's tool-use workarounds) into a single, unified API.

{: .highlight }

> **See it in action:** The [Brand Perception Checker](https://github.com/node-llm/node-llm/tree/main/examples/applications/brand-perception-checker) demonstrates utilizing rigorous Zod schemas to extract consistent semantic profiles across multiple providers simultaneously.

---

## Using Zod (Recommended)

The easiest way to define schemas is with Zod.

```ts
import { NodeLLM, z } from "@node-llm/core";

// Define a schema using Zod
const personSchema = z.object({
  name: z.string().describe("Person's full name"),
  age: z.number().describe("Person's age in years"),
  hobbies: z.array(z.string()).describe("List of hobbies")
});

const chat = NodeLLM.chat("gpt-4o-mini");

// Use .withSchema() to enforce the structure
const response = await chat
  .withSchema(personSchema)
  .ask("Generate a person named Alice who likes hiking and coding");

// Streaming is also supported!
// for await (const chunk of chat.withSchema(personSchema).stream("...")) { ... }

// The response is strictly validated and parsed
const person = response.data;

console.log(person.name); // "Alice"
console.log(person.age); // e.g. 25
console.log(person.hobbies); // ["hiking", "coding"]
```

---

## Manual JSON Schemas

You can also provide a raw JSON schema object if you prefer not to use Zod.

**Note for OpenAI:** By default, `NodeLLM` uses OpenAI's "Strict Mode" (which sets `strict: true` and `additionalProperties: false` in the schema). 

You can configure this by setting the `strict` property to `false` in the [Schema constructor](/core-features/models.html#schema).

```ts
// OpenAI 100% Strict Mode enabled automatically
const response = await chat.withSchema(schema).ask("Generate a person");
```
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  },
  required: ["name", "age"],
  additionalProperties: false // Required for strict mode in OpenAI
};

const response = await chat.withSchema(schema).ask("Generate a person");

console.log(response.data); // { name: "...", age: ... }
```

---

## JSON Mode

If you just need valid JSON but don't want to enforce a rigid schema, you can enable JSON mode. This instructs the model to return valid JSON but gives it more freedom with the structure.

```ts
chat.withRequestOptions({
  responseFormat: { type: "json_object" }
});

const response = await chat.ask("Generate a JSON object with a greeting");
console.log(response.data); // { greeting: "..." } or whatever keys it chose
```

---

## Provider Support

| Provider      | Method Used                                | Notes                                                                                                           |
| :------------ | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **OpenAI**    | `response_format: { type: "json_schema" }` | Fully supported with strict adherence.                                                                          |
| **Gemini**    | `responseSchema`                           | Supported natively.                                                                                             |
| **Anthropic** | Tool Use (Mock)                            | `NodeLLM` automatically creates a tool definition and forces the model to use it to simulate structured output. |

---

## Nested Schemas

Complex nested schemas are fully supported via Zod.

```ts
const companySchema = z.object({
  name: z.string(),
  employees: z.array(
    z.object({
      name: z.string(),
      role: z.enum(["developer", "designer", "manager"]),
      skills: z.array(z.string())
    })
  ),
  metadata: z.object({
    founded: z.number(),
    industry: z.string()
  })
});

const response = await chat.withSchema(companySchema).ask("Generate a small tech startup");
```

---

## 🛡️ Automating Schema Correction (Middleware)

Even with strict schemas, non-OpenAI models (like Claude, Gemini, or local models) can occasionally hallucinate invalid JSON or skip required fields.

You can use the **Schema Self-Correction Middleware** to handle this automatically. If validation fails, `NodeLLM` will catch the error, send it back to the LLM as feedback, and retry the request up to `maxRetries` times.

### Usage

```ts
import { NodeLLM, SchemaSelfCorrection, z } from "@node-llm/core";

const schema = z.object({ age: z.number() });

const chat = NodeLLM.chat("claude-3-5-sonnet", {
  schema,
  // Add the self-correction middleware
  middlewares: [
    SchemaSelfCorrection({ maxRetries: 2 })
  ]
});

// If Claude returns { "age": "30" } (string), the middleware 
// will automatically re-prompt: "Error: Expected number, received string at 'age'. Please fix."
const response = await chat.ask("Get age");

console.log(response.data.age); // Guaranteed to be a number or throws after max retries
```

### Why use this?
- **Reliability**: Turn every provider into a "Strict Output" provider.
- **Clean Logic**: No more manual `try/catch` and retry loops in your application code.
- **Feedback Loop**: Providing the exact Zod error to the LLM is more effective than generic "Fix this" prompts.
