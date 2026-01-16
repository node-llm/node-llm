---
layout: default
title: Migration Guide (v1.6)
parent: Getting Started
nav_order: 10
permalink: /getting-started/migration-guide-v1-6
description: Guide for migrating to NodeLLM v1.6.0 strict provider configuration.
---

# Migrating to NodeLLM v1.6.0
{: .no_toc }

NodeLLM v1.6.0 builds upon the **Immutable Architecture** introduced in v1.5.0 and introduces stricter configuration requirements to eliminate ambiguity when working with multiple providers.

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Strict Provider Requirement

The most significant change in v1.6.0 is the removal of "Automatic Provider Detection."

### Legacy Behavior (v1.5 and below)

NodeLLM would previously attempt to guess which provider you wanted based on the presence of API keys (e.g., defaulting to OpenAI if `OPENAI_API_KEY` was found).

### New Behavior (v1.6.0)

If you use the direct `NodeLLM` singleton, you **must now explicitly set** the `NODELLM_PROVIDER` environment variable.

```bash
# .env - REQUIRED for Zero-Config
NODELLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

If this variable is missing, `NodeLLM.chat()` will now throw a `ProviderNotConfiguredError` rather than guessing.

---

## Immutable Global Configuration (Reminder)

While introduced in v1.5.0, v1.6.0 reinforces that the global `NodeLLM` instance is **Frozen**.

### ❌ No-Op: `NodeLLM.configure()`

Programmatic mutation of the global singleton is no longer supported.

```javascript
// This pattern has been deprecated since v1.5 and remains a no-op in v1.6
import { NodeLLM } from "@node-llm/core";

NodeLLM.configure({ ... }); // ⚠️ WARNING: No effect.
```

### ✅ Use Scoped Instances

For programmatic configuration, always use `createLLM()` or `.withProvider()`.

```javascript
import { createLLM } from "@node-llm/core";

const llm = createLLM({
  provider: "anthropic",
  anthropicApiKey: "sk-..."
});
```

---

## Typed Error Hierarchy

In v1.6.0, we have moved from generic `Error` strings to a robust, typed error hierarchy. This allows for better programmatic handling of LLM failures.

| Feature          | Legacy Error                            | New v1.6 Error               |
| :--------------- | :-------------------------------------- | :--------------------------- |
| Missing Feature  | `Error: ... does not support ...`       | `UnsupportedFeatureError`    |
| Missing Provider | `Error: LLM provider not configured`    | `ProviderNotConfiguredError` |
| Model Mismatch   | `Error: Model ... does not support ...` | `ModelCapabilityError`       |

---

## Design Rationale

These changes complete the architectural transition started in v1.5.0:

1. **No Ambiguity**: By requiring `NODELLM_PROVIDER`, we ensure that a single model (like `llama3`) is never accidentally routed to the wrong provider (Ollama vs OpenRouter).
2. **Stable Contracts**: The Immutable Singleton ensures that your application configuration is predictable and thread-safe from the moment of first access.
3. **Production Observability**: Typed errors make it easier to build automated monitors and fallback logic around specific provider failure modes.
