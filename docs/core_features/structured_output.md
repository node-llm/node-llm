---
layout: default
title: Structured Output
parent: Core Features
nav_order: 3
---

# Structured Output

Ensure the AI returns data exactly matching a specific structure. `node-llm` supports strict schema validation using **Zod** (recommended) or manual JSON schemas.

This feature abstracts the provider-specific implementations (like OpenAI's `json_schema`, Gemini's `responseSchema`, or Anthropic's tool-use workarounds) into a single, unified API.

## Using Zod (Recommended)

The easiest way to define schemas is with Zod.

```ts
import { LLM, z } from "@node-llm/core";

// Define a schema using Zod
const personSchema = z.object({
  name: z.string().describe("Person's full name"),
  age: z.number().describe("Person's age in years"),
  hobbies: z.array(z.string()).describe("List of hobbies")
});

const chat = LLM.chat("gpt-4o-mini");

// Use .withSchema() to enforce the structure
const response = await chat
  .withSchema(personSchema)
  .ask("Generate a person named Alice who likes hiking and coding");

// The response is strictly validated and parsed
const person = response.parsed;

console.log(person.name); // "Alice"
console.log(person.age);  // e.g. 25
console.log(person.hobbies); // ["hiking", "coding"]
```

## Manual JSON Schemas

You can also provide a raw JSON schema object if you prefer not to use Zod.

**Note for OpenAI:** You must strictly follow OpenAI's requirements, such as setting `additionalProperties: false`.

```ts
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" }
  },
  required: ["name", "age"],
  additionalProperties: false // Required for strict mode in OpenAI
};

const response = await chat
  .withSchema(schema)
  .ask("Generate a person");

console.log(response.parsed); // { name: "...", age: ... }
```

## JSON Mode

If you just need valid JSON but don't want to enforce a rigid schema, you can enable JSON mode. This instructs the model to return valid JSON but gives it more freedom with the structure.

```ts
chat.withRequestOptions({
  responseFormat: { type: "json_object" }
});

const response = await chat.ask("Generate a JSON object with a greeting");
console.log(response.parsed); // { greeting: "..." } or whatever keys it chose
```

## Provider Support

| Provider | Method Used | Notes |
| :--- | :--- | :--- |
| **OpenAI** | `response_format: { type: "json_schema" }` | Fully supported with strict adherence. |
| **Gemini** | `responseSchema` | Supported natively. |
| **Anthropic** | Tool Use (Mock) | `node-llm` automatically creates a tool definition and forces the model to use it to simulate structured output. |

## Nested Schemas

Complex nested schemas are fully supported via Zod.

```ts
const companySchema = z.object({
  name: z.string(),
  employees: z.array(z.object({
    name: z.string(),
    role: z.enum(["developer", "designer", "manager"]),
    skills: z.array(z.string())
  })),
  metadata: z.object({
    founded: z.number(),
    industry: z.string()
  })
});

const response = await chat
  .withSchema(companySchema)
  .ask("Generate a small tech startup");
```
