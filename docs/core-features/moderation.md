---
layout: default
title: Moderation
parent: Core Features
nav_order: 4
description: Protect your users and your brand by checking text content against safety policies for violence, hate speech, and harassment.
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

Check if text content violates safety policies using \`NodeLLM.moderate\`. This is crucial for user-facing applications to prevent abuse.

## Basic Usage

The simplest check returns a flagged boolean and categories.

```ts
const result = await NodeLLM.moderate("I want to help everyone!");

if (result.flagged) {
  console.log(`❌ Flagged for: ${result.flaggedCategories.join(", ")}`);
} else {
  console.log("✅ Content appears safe");
}
```

## Understanding Results

The moderation result object provides detailed signals:

- `flagged`: (boolean) Overall safety check. if true, content violates provider policies.
- `categories`: (object) Boolean flags for specific buckets (e.g., `sexual: false`, `violence: true`).
- `category_scores`: (object) Confidence scores (0.0 - 1.0) for each category.

```ts
const result = await NodeLLM.moderate("Some controversial text");

// Check specific categories
if (result.categories.hate) {
  console.log("Hate speech detected");
}

// Check confidence levels
console.log(`Violence Score: ${result.category_scores.violence}`);
```

### Common Categories

- **Sexual**: Sexual content.
- **Hate**: Content promoting hate based on identity.
- **Harassment**: Threatening or bullying content.
- **Self-Harm**: Promoting self-harm or suicide.
- **Violence**: Promoting or depicting violence.

## Integration Patterns

### Pre-Chat Moderation

We recommend validating user input _before_ sending it to a Chat model to save costs and prevent jailbreaks.

```ts
async function safeChat(input: string) {
  const mod = await NodeLLM.moderate(input);

  if (mod.flagged) {
    throw new Error(`Content Unsafe: ${mod.flaggedCategories.join(", ")}`);
  }

  // Only proceed if safe
  return await chat.ask(input);
}
```

### Custom Risk Thresholds

Providers have their own thresholds for "flagging". You can implement stricter (or looser) logic using raw scores.

```ts
const result = await NodeLLM.moderate(userInput);

// Custom strict policy: Flag anything with > 0.1 confidence
const isRisky = Object.entries(result.category_scores).some(([category, score]) => score > 0.1);

if (isRisky) {
  console.warn("Potential risk detected (custom strict mode)");
}
```
