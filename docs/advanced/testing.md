---
layout: default
title: Testing
parent: Advanced
nav_order: 6
description: Run automated tests using our high-fidelity VCR recording system to ensure reliable integrations without wasting API credits.
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

\`NodeLLM\` features a comprehensive test suite including high-level integration tests and granular unit tests.

## Running Tests

### Unit Tests

Test core logic and provider handlers in isolation without hitting any APIs.

```bash
npm run test:unit
```

### Integration Tests (VCR)

Uses Polly.js to record and replay real LLM interactions.

**Replay Mode (Default)**:
Runs against recorded cassettes. Fast and requires no API keys.

```bash
npm run test:integration
```

**Record Mode**:
Update cassettes by hitting real APIs (requires API keys).

```bash
VCR_MODE=record npm run test:integration
```

_All recordings are automatically scrubbed of sensitive data (API keys, org IDs) before being saved to disk._
