---
layout: default
title: Testing
parent: Core Features
nav_order: 10
permalink: /core-features/testing
description: Deterministic testing infrastructure for NodeLLM applications. VCR integration and fluent mocking for reliable AI systems.
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

## Overview

Deterministic testing infrastructure for NodeLLM-powered AI systems. Built for engineers who prioritize **Boring Solutions**, **Security**, and **High-Fidelity Feedback Loops**.

> 💡 **What is High-Fidelity?**
> Your tests exercise the same execution path, provider behavior, and tool orchestration as production — without live network calls.

**Framework Support**: ✅ Vitest (native) | ✅ Jest (compatible via core APIs) | ✅ Any test framework

---

## The Philosophy: Two-Tier Testing

We believe AI testing should never be flaky or expensive. We provide two distinct strategies:

### 1. VCR (Integration Testing) 📼

**When to use**: To verify your system works with real LLM responses without paying for every test run.

- **High Fidelity**: Captures the **NodeLLM-normalized LLM execution** (model, prompt, tools, retries, and final output), ensuring replay remains stable even if provider APIs change.
- **Security First**: Automatically scrubs API Keys and sensitive PII from "cassettes".
- **CI Safe**: Fails-fast in CI if a cassette is missing, preventing accidental live API calls.
 
 > 🚨 **CI Safety Guarantee**
 > When `CI=true`, VCR **will never** record new cassettes.
 > If a matching cassette is missing or mismatched, the test fails immediately.

### 2. Mocker (Unit Testing) 🎭
 
 > ⚠️ **Note**
 > The Mocker does **not** attempt to simulate model intelligence or reasoning.
 > It deterministically simulates provider responses to validate application logic, error handling, and control flow.

**When to use**: To test application logic, edge cases (errors, rate limits), and rare tool-calling paths.

- **Declarative**: Fluent, explicit API to define expected prompts and responses.
- **Multimodal**: Native support for `chat`, `embed`, `paint`, `transcribe`, and `moderate`.
- **Streaming**: Simulate token-by-token delivery to test real-time UI logic.

---

## 📼 VCR Usage

### Basic Interaction

Wrap your tests in `withVCR` to automatically record interactions the first time they run.

```typescript
import { withVCR } from "@node-llm/testing";

it(
  "calculates sentiment correctly",
  withVCR(async () => {
    const result = await mySentimentAgent.run("I love NodeLLM!");
    expect(result.sentiment).toBe("positive");
  })
);
```

### Hierarchical Organization (Convention-Based Mode) 📂

Organize your cassettes into nested subfolders to match your test suite structure.

```typescript
import { describeVCR, withVCR } from "@node-llm/testing";

describeVCR("Authentication", () => {
  describeVCR("Login", () => {
    it(
      "logs in successfully",
      withVCR(async () => {
        // Cassette saved to: test/cassettes/authentication/login/logs-in-successfully.json
      })
    );
  });
});
```

### Security & Scrubbing 🛡️

The VCR automatically redacts `api_key`, `authorization`, and other sensitive headers. You can add custom redaction:

```typescript
withVCR({
  // Redact by key name
  sensitiveKeys: ["user_ssn", "stripe_token"],
  
  // Redact by value pattern (Regex)
  sensitivePatterns: [/sk-test-[0-9a-zA-Z]+/g],
  
  // Advanced: Custom function hook
  scrub: (data) => data.replace(/SSN: \d+/g, "[REDACTED_SSN]")
}, async () => { ... });
```
### Global Configuration 🌍

Instead of repeating configuration in every test, set global defaults in your test setup file:

```typescript
import { configureVCR } from "@node-llm/testing";

configureVCR({
  cassettesDir: "test/__cassettes__", // Configurable global path
  sensitiveKeys: ["user_ssn", "stripe_token"],
  sensitivePatterns: [/sk-test-[0-9a-zA-Z]+/g]
});
```

### Per-Test Overrides

You can still override defaults on a per-test basis:

```typescript
withVCR({
  // Merged with global config
  sensitiveKeys: ["specific_secret"] 
}, async () => { ... });
```
---

## 🎭 Mocker Usage

### Fluent Mocking

Define lightning-fast, zero-network tests for your agents.

```typescript
import { mockLLM } from "@node-llm/testing";

const mocker = mockLLM();

// Exact match
mocker.chat("Ping").respond("Pong");

// Regex match
mocker.chat(/hello/i).respond("Greetings!");

// Simulate a Tool Call
mocker.chat("What's the weather?").callsTool("get_weather", { city: "London" });
```

### Streaming Mocks 🌊

Test your streaming logic by simulating token delivery.

```typescript
mocker.chat("Tell a story").stream(["Once ", "upon ", "a ", "time."]);
```

### Multimodal Mocks 🎨

```typescript
mocker.paint(/a cat/i).respond({ url: "https://mock.com/cat.png" });
mocker.embed("text").respond({ vectors: [[0.1, 0.2, 0.3]] });
```

---

## 🛣️ Decision Tree: VCR vs Mocker

Choose the right tool for your test:

```
Does your test need to verify behavior against REAL LLM responses?
├─ YES → Use VCR (integration testing)
│   ├─ Do you need to record the first time and replay afterward?
│   │   └─ YES → Use VCR in "record" or "auto" mode
│   ├─ Are you testing in CI/CD? (No live API calls allowed)
│   │   └─ YES → Set VCR_MODE=replay in CI
│   └─ Need custom scrubbing for sensitive data?
│       └─ YES → Use withVCR({ scrub: ... })
│
└─ NO → Use Mocker (unit testing)
    ├─ Testing error handling, edge cases, or rare paths?
    │   └─ YES → Mock the error with mocker.chat(...).respond({ error: ... })
    ├─ Testing streaming token delivery?
    │   └─ YES → Use mocker.chat(...).stream([...])
    └─ Testing tool-calling paths without real tools?
        └─ YES → Use mocker.chat(...).callsTool(name, params)
```

**Quick Reference**:
- **VCR**: Database queries, API calls, real provider behavior, network latency
- **Mocker**: Business logic, UI interactions, error scenarios, tool orchestration

### At-a-Glance Comparison

| Use Case | VCR | Mocker |
|----------|-----|--------|
| Real provider behavior | ✅ | ❌ |
| CI-safe (no live calls) | ✅ (after record) | ✅ |
| Zero network overhead | ❌ (first run) | ✅ |
| Error simulation | ⚠️ (record real) | ✅ |
| Tool orchestration | ✅ | ✅ |
| Streaming tokens | ✅ | ✅ |

---

## ⚙️ Configuration Contract

| Env Variable       | Description                                                | Default          |
| ------------------ | ---------------------------------------------------------- | ---------------- |
| `VCR_MODE`         | `record`, `replay`, `auto`, or `passthrough`               | `auto`           |
| `VCR_CASSETTE_DIR` | Base directory for cassettes                               | `test/cassettes` |
| `CI`               | When true, VCR prevents recording and forces exact matches | (Auto-detected)  |

---

## 🏛️ Integration with @node-llm/orm

The testing tools operate at the `providerRegistry` level. This means they **automatically** intercept LLM calls made by the ORM layer.

### Pattern: Testing Database Persistence

When using `@node-llm/orm`, you can verify both the database state and the LLM response in a single test.

```typescript
import { withVCR } from "@node-llm/testing";
import { createChat } from "@node-llm/orm/prisma";

it(
  "saves the LLM response to the database",
  withVCR(async () => {
    // 1. Setup ORM Chat
    const chat = await createChat(prisma, llm, { model: "gpt-4" });

    // 2. Interaction (VCR intercepts the LLM call)
    await chat.ask("Hello ORM!");

    // 3. Verify DB state (standard Prisma/ORM assertions)
    const messages = await prisma.assistantMessage.findMany({
      where: { chatId: chat.id }
    });

    expect(messages).toHaveLength(2); // User + Assistant
    expect(messages[1].content).toBeDefined();
  })
);
```

### Pattern: Mocking Rare Logic

Use the `Mocker` to test how your application handles complex tool results or errors without setting up a real LLM.

```typescript
import { mockLLM } from "@node-llm/testing";

it("handles tool errors in ORM sessions", async () => {
  const mocker = mockLLM();
  mocker.chat("Search docs").respond({ error: new Error("DB Timeout") });

  const chat = await loadChat(prisma, llm, "existing-id");

  await expect(chat.ask("Search docs")).rejects.toThrow("DB Timeout");
});
```

---

## 🧪 Framework Integration

### Vitest (Native Support)

Vitest is the primary test framework with optimized helpers:

```typescript
import { it, describe } from "vitest";
import { mockLLM, withVCR, describeVCR } from "@node-llm/testing";

describeVCR("Payments", () => {
  it(
    "processes successfully",
    withVCR(async () => {
      // ✨ withVCR auto-detects test name ("processes successfully")
      // ✨ describeVCR auto-manages scopes
    })
  );
});
```

### Jest Compatibility

All core APIs work with Jest. The only difference: `withVCR()` can't auto-detect test names, so provide it manually:

```typescript
import { describe, it } from "@jest/globals";
import { mockLLM, setupVCR, describeVCR } from "@node-llm/testing";

describeVCR("Payments", () => {
  it("processes successfully", async () => {
    // ✅ describeVCR works with Jest (framework-agnostic)
    // ⚠️ withVCR doesn't work here (needs Vitest's expect.getState())
    // ✅ Use setupVCR instead:
    const vcr = setupVCR("processes", { mode: "record" });

    const mocker = mockLLM();  // ✅ works with Jest
    mocker.chat("pay").respond("done");

    // Test logic here

    await vcr.stop();
  });
});
```

### Framework Support Matrix

| API | Vitest | Jest | Any Framework |
|-----|--------|------|---------------|
| `mockLLM()` | ✅ | ✅ | ✅ |
| `describeVCR()` | ✅ | ✅ | ✅ |
| `setupVCR()` | ✅ | ✅ | ✅ |
| `withVCR()` | ✅ (auto name) | ⚠️ (manual name) | ⚠️ (manual name) |
| Mocker class | ✅ | ✅ | ✅ |
| VCR class | ✅ | ✅ | ✅ |

**Only `withVCR()` is Vitest-specific** because it auto-detects test names. All other APIs are framework-agnostic.

### Any Test Framework

Using raw classes for maximum portability:

```typescript
import { Mocker, VCR } from "@node-llm/testing";

// Mocker - works everywhere
const mocker = new Mocker();
mocker.chat("hello").respond("hi");

// VCR - works everywhere
const vcr = new VCR("test-name", { mode: "record" });
// ... run test ...
await vcr.stop();
```

---

## 🚨 Common Error Scenarios

### VCR: Missing Cassette

**Error**: `Error: Cassette file not found`

**Cause**: VCR is in `replay` mode but the cassette doesn't exist yet.

**Solution**:
```bash
# Record it first
VCR_MODE=record npm test

# Or use auto mode (records if missing, replays if exists)
VCR_MODE=auto npm test
```

### VCR: Cassette Mismatch

**Error**: `AssertionError: No interaction matched the request`

**Cause**: Your code is making a request that doesn't match any recorded interaction.

**Solution**:
```bash
# Re-record the cassette
rm -rf test/cassettes/your-test
VCR_MODE=record npm test -- your-test
```

### Mocker: Strict Mode Violation

**Error**: `Error: No mock defined for prompt: "unexpected question"`

**Cause**: Your code asked a question you didn't mock in strict mode.

**Solution**:
```typescript
// Add the missing mock
mocker.chat("unexpected question").respond("mocked response");

// Or disable strict mode
const mocker = mockLLM({ strict: false });
```

### Mocker: Debug Information

Get insight into what mocks are registered:

```typescript
const mocker = mockLLM();
mocker.chat("hello").respond("hi");
mocker.embed("text").respond({ vectors: [[0.1, 0.2]] });

const debug = mocker.getDebugInfo();
console.log(debug);
// Output: { totalMocks: 2, methods: ["chat", "embed"] }
```

---

## 🎯 Advanced Patterns

### Pattern: Parametrized Testing with VCR

Test the same logic against multiple scenarios by organizing cassettes hierarchically:

```typescript
describeVCR("Payment Processing", () => {
  ["visa", "mastercard", "amex"].forEach((cardType) => {
    describeVCR(cardType, () => {
      it(
        "processes payment",
        withVCR(async () => {
          const result = await processor.pay({
            amount: 100,
            cardType
          });
          expect(result.status).toBe("success");
        })
      );
    });
  });
});

// Cassettes created at:
// test/cassettes/payment-processing/visa/processes-payment.json
// test/cassettes/payment-processing/mastercard/processes-payment.json
// test/cassettes/payment-processing/amex/processes-payment.json
```

### Pattern: Strict Mode for Safety

Enforce that every expected interaction is mocked:

```typescript
describe("Customer Service Bot", () => {
  it("responds to greeting", async () => {
    const mocker = mockLLM({ strict: true });
    mocker.chat("hello").respond("Hello! How can I help?");
    
    await bot.handle("hello");
    // Pass ✅
  });

  it("fails if unmocked", async () => {
    const mocker = mockLLM({ strict: true });
    mocker.chat("hello").respond("Hello!");
    
    // This throws because "goodbye" wasn't mocked
    await expect(bot.handle("goodbye")).rejects.toThrow();
  });
});
```

### Pattern: Testing Streaming

Simulate token delivery to verify UI updates correctly:

```typescript
it("displays tokens as they arrive", async () => {
  const mocker = mockLLM();
  mocker.chat("Write a poem").stream([
    "Roses ",
    "are ",
    "red\n",
    "Violets ",
    "are ",
    "blue"
  ]);

  const tokens = [];
  await llm.stream("Write a poem", {
    onToken: (token) => tokens.push(token)
  });

  expect(tokens).toEqual([
    "Roses ",
    "are ",
    "red\n",
    "Violets ",
    "are ",
    "blue"
  ]);
});
```

---

## 🏛️ Architecture Contract

- **No Side Effects**: Mocks and VCR interceptors are automatically cleared after each test turn.
- **Deterministic**: The same input MUST always yield the same output in Replay mode.
- **Explicit > Implicit**: We prefer explicit mock definitions over complex global state.
 
 ---
 
 ## 🛑 When Not to Use @node-llm/testing
 
 - Do not use **VCR** for rapid prompt iteration — use live calls instead.
 - Do not use **Mocker** to validate response quality or correctness.
 - Do not commit **cassettes** for experimental or throwaway prompts.
