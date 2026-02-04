---
layout: default
title: Prisma Adapter
parent: Monitor & Observability
nav_order: 1
permalink: /monitor/prisma
description: Production-ready Prisma adapter for NodeLLM Monitor. Store and query LLM metrics in your database.
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

## Installation

```bash
npm install @node-llm/monitor @prisma/client prisma
```

---

## Schema Setup

Add the monitoring events table to your Prisma schema:

```prisma
// prisma/schema.prisma

model monitoring_events {
  id            String   @id @default(uuid())
  eventType     String   // request.start, request.end, tool.start, etc.
  requestId     String   @map("requestId")
  sessionId     String?  @map("sessionId")
  transactionId String?  @map("transactionId")
  time          DateTime @default(now())
  duration      Int?     // duration in ms
  cost          Float?
  cpuTime       Float?
  gcTime        Float?
  allocations   Int?
  payload       Json     // Stores metadata, tokens and optional content
  createdAt     DateTime @default(now())
  provider      String
  model         String

  @@index([requestId])
  @@index([sessionId])
  @@index([transactionId])
  @@index([time])
}
```

Run the migration:

```bash
npx prisma migrate dev --name add_monitoring_events
```

_Note: For non-Prisma users, a raw SQL migration is available at `migrations/001_create_monitoring_events.sql`._

---

## Basic Usage

```typescript
import { PrismaClient } from "@prisma/client";
import { createLLM } from "@node-llm/core";
import { createPrismaMonitor } from "@node-llm/monitor";

const prisma = new PrismaClient();
const monitor = createPrismaMonitor(prisma);

const llm = createLLM({
  provider: "openai",
  model: "gpt-4o-mini",
  openaiApiKey: process.env.OPENAI_API_KEY,
  middlewares: [monitor],
});

// Now all LLM calls are persisted to your database
const chat = llm.chat();
await chat.ask("What is the weather today?");
```

---

## Configuration Options

```typescript
const monitor = createPrismaMonitor(prisma, {
  // Capture full request/response content (default: false)
  captureContent: true,
  
  // Enable content scrubbing for PII protection
  // (automatically enabled when captureContent is true)
  scrubbing: {
    pii: true,     // Scrub emails, phone numbers, SSNs
    secrets: true, // Scrub API keys, passwords
  },
  
  // Error handling callback
  onError: (error, event) => {
    console.error("Monitor error:", error, "Event:", event.eventType);
  },
});
```

---

## Querying Events

Since the Prisma Adapter stores data in your database, the best way to query events is using the Prisma Client directly.

### Direct Prisma Queries

```typescript
// Get all events for a specific request
const requestEvents = await prisma.monitoring_events.findMany({
  where: { requestId: "req_123" },
  orderBy: { time: "asc" },
});

// Calculate total cost for a time period
const result = await prisma.monitoring_events.aggregate({
  where: {
    eventType: "request.end",
    time: {
      gte: new Date("2024-01-01"),
      lte: new Date("2024-01-31"),
    },
  },
  _sum: { cost: true },
});
console.log(`January cost: $${result._sum.cost}`);

// Get usage by provider
const byProvider = await prisma.monitoring_events.groupBy({
  by: ["provider", "model"],
  where: { eventType: "request.end" },
  _count: true,
  _sum: { cost: true, duration: true },
});
```

## Dashboard Integration

To view your Prisma data in the visual dashboard, you can use the ergonomic `monitor.api()` shorthand for Express-based applications:

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { createPrismaMonitor } from "@node-llm/monitor";

const app = express();
const prisma = new PrismaClient();
const monitor = createPrismaMonitor(prisma);

// Dashboard handles its own routing under basePath
app.use(monitor.api({ basePath: "/monitor" }));

app.listen(3001, () => {
  console.log("Dashboard at http://localhost:3001/monitor");
});
```

For non-Express environments or manual routing, you can use the `createMonitorMiddleware` factory directly:

```typescript
import { createMonitorMiddleware, PrismaAdapter } from "@node-llm/monitor";
const adapter = new PrismaAdapter(prisma);
app.use(createMonitorMiddleware(adapter, { basePath: "/monitor" }));
```

The dashboard provides:
- Real-time event stream
- Cost analysis charts
- Provider/model breakdown
- Request detail viewer
- Error tracking

---

## Best Practices

### 1. Index Optimization

Add indexes for your most common query patterns:

```prisma
@@index([time, provider])
@@index([sessionId, time])
@@index([eventType, time])
```

### 2. Data Retention

Set up a cleanup job for old events:

```typescript
// Delete events older than 90 days
await prisma.monitoring_events.deleteMany({
  where: {
    time: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  },
});
```

### 3. Separate Database

For high-volume applications, consider a separate database for monitoring:

```prisma
datasource monitorDb {
  provider = "postgresql"
  url      = env("MONITOR_DATABASE_URL")
}
```



---

## Troubleshooting

### Table Not Found

If you get "monitoring_events table not found", ensure:

1. You've added the schema to `prisma/schema.prisma`
2. You've run `npx prisma migrate dev`
3. Your Prisma client is regenerated: `npx prisma generate`

### Type Errors

If using custom table names, ensure your Prisma client types match:

```typescript
// Generate types after schema changes
npx prisma generate
```

