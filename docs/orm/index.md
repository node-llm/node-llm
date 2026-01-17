---
layout: default
title: ORM & Persistence
nav_order: 4
has_children: true
permalink: /orm
description: Database persistence layer for NodeLLM. Automatically track chats, messages, tool calls, and API metrics.
---

# {{ page.title }}
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

---

## Quick Setup

NodeLLM ORM provides a robust persistence layer that bridges the gap between your application database and LLM providers. It ensures that every turn in a conversation is safely stored, while maintaining high performance for real-time streaming.

Currently, we support **Prisma** with a dedicated adapter.

### installation

```bash
npm install @node-llm/orm @node-llm/core @prisma/client
```

---

## Strategic Design

The ORM is designed to be an **infrastructure-first** layer, much like the core package. It doesn't just store text; it captures the entire execution lifecycle, including:

- **Token Consumption**: Track input/output tokens per message and per request.
- **Tool Audit Trail**: Record every tool call, its parameters, thought process, and result.
- **Provider attribution**: Know exactly which model and provider served which message.
- **Request Metadata**: Log latency, status codes, and cost for every API interaction.

[Explore the Prisma Adapter](/orm/prisma.html){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
