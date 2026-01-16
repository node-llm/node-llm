---
layout: default
title: Security & Compliance
parent: Advanced
nav_order: 1
description: Learn how NodeLLM acts as an architectural security layer with context isolation, content filtering, human-in-the-loop tool execution, and resource limits.
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

NodeLLM is built from the ground up to be an **architectural security layer**. In production AI applications, the LLM is often the most vulnerable component due to prompt injection, instruction drift, and potential PII leakage.

NodeLLM provides several "Zero-Config" and pluggable security features to mitigate these risks.

---

## 🧱 Smart Context Isolation

The most common vector for LLM vulnerabilities is **Instruction Injection**, where user input tricks the model into ignoring its system instructions.

NodeLLM solves this by maintaining a strict architectural boundary between **System Instructions** and **Conversation History**.

- **Isolation**: Instructions are stored separately from the user message stack. They are never interleaved in a way that allows a user to "close" a system block.
- **Priority**: When sending a payload to a provider, NodeLLM ensures instructions are placed in the most authoritative role available.
- **Drift Protection**: Even in long conversations with many turns, NodeLLM continuously re-asserts the system context as the primary authority.

---

## 🛡️ Content Policy Hooks <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>

NodeLLM allows you to inject security and compliance policies at the **edge** of the request/response cycle using asynchronous hooks.

### `beforeRequest` (Input Guardrail)

Intercept messages before they reach the LLM. Use this for **PII Detection** and **Redaction**.

```ts
chat.beforeRequest(async (messages) => {
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      msg.content = msg.content.replace(/\d{3}-\d{2}-\d{4}/g, "[REDACTED_SSN]");
    }
  }
  return messages;
});
```

### `afterResponse` (Output Guardrail)

Verify the LLM's output before it reaches your application logic. Use this for **Compliance Verification** or **Sensitive Data Masking**.

```ts
chat.afterResponse(async (response) => {
  if (response.content.includes("SECRET_API_KEY")) {
    return response.withContent("Error: Sensitive data detected in output.");
  }
});
```

---

## 🔍 Observability as Security <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>

Security in AI is not just about blocking; it's about **Auditing**. NodeLLM provides high-fidelity hooks for monitoring the entire lifecycle of tool executions, which are often the most sensitive part of an AI agent.

- **`onToolCallStart`**: Audit exactly what parameters the LLM is trying to send to your internal functions.
- **`onToolCallEnd`**: Record the raw data returned from your systems to the LLM.
- **`onToolCallError`**: Track failed attempts or malicious inputs that caused tool crashes.

```ts
chat
  .onToolCallStart((call) => auditLog.info(`Tool ${call.function.name} requested`))
  .onToolCallError((call, err) => incidentResponse.trigger(`Tool failure: ${err.message}`));
```

---

## 🚦 Tool Execution Policies <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>

For sensitive operations (like database writes or financial transactions), NodeLLM provides granular control over the tool execution lifecycle via `toolExecution` modes.

- **`auto`**: (Default) Tools are executed immediately as proposed by the LLM.
- **`confirm`**: Enables **Human-in-the-loop**. NodeLLM pauses before execution and awaits approval via the `onConfirmToolCall` hook.
- **`dry-run`**: Proposes the tool call structure but **never executes it**. Useful for UI previews or verification-only flows.

```ts
chat.withToolExecution("confirm").onConfirmToolCall(async (call) => {
  // Return true to execute, false to cancel
  return await userResponse.confirm(`Allow tool: ${call.function.name}?`);
});
```

Security value:

- **Prevents Destructive Actions**: Stops the model from accidentally deleting data without oversight.
- **Human-in-the-loop**: Increases trust by ensuring critical business logic remains under human control.

---

## 🛡️ Loop Protection & Resource Limits <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>

NodeLLM provides **defense-in-depth** protection against resource exhaustion, runaway costs, and denial-of-service attacks through configurable execution limits.

### Request Timeout

Prevent hanging requests that could tie up resources or enable DoS attacks. By default, all requests timeout after **30 seconds**.

```ts
// Global configuration
const llm = createLLM({
  requestTimeout: 30000 // 30 seconds (default)
});

// Per-request override for long-running tasks
await chat.ask("Analyze this large dataset", {
  requestTimeout: 120000 // 2 minutes
});
```

**Security Benefits:**

- **DoS Protection**: Prevents malicious or buggy providers from hanging indefinitely
- **Resource Control**: Limits memory, connection, and thread pool consumption
- **Cost Control**: Prevents runaway requests from generating unexpected costs
- **Predictable SLAs**: Ensures applications have predictable response times

### Loop Guard (Tool Execution Limit)

Prevent infinite tool execution loops that could exhaust resources or rack up costs.

```ts
const llm = createLLM({
  maxToolCalls: 5 // Stop after 5 sequential tool execution turns (default)
});

// Override for complex workflows
await chat.ask("Deep research task", { maxToolCalls: 10 });
```

**Security Benefits:**

- **Cost Control**: Prevents infinite loops from generating unbounded API costs
- **Resource Protection**: Stops runaway tool executions from exhausting system resources

### Retry Limit

Prevent retry storms that could cascade through your system during provider outages.

```ts
const llm = createLLM({
  maxRetries: 2 // Retry failed requests twice (default)
});
```

**Security Benefits:**

- **Cascading Failure Prevention**: Stops retry storms during provider outages
- **Resource Protection**: Prevents excessive retries from exhausting connection pools

### Complete Security Configuration

Combine all limits for comprehensive protection:

```ts
const llm = createLLM({
  requestTimeout: 30000, // 30 second timeout
  maxRetries: 2, // Retry failed requests twice
  maxToolCalls: 5, // Limit tool execution loops
  maxTokens: 4096 // Limit output to 4K tokens
});
```

This creates a **defense-in-depth** strategy where multiple layers of protection work together to prevent resource exhaustion, cost overruns, and service disruptions.

**Security Summary:**

- **`requestTimeout`**: DoS protection, resource control, predictable SLAs
- **`maxRetries`**: Prevents cascading failures and retry storms
- **`maxToolCalls`**: Prevents infinite loops and runaway costs
- **`maxTokens`**: Prevents excessive output generation and cost overruns

---

## ⚡ Smart Developer Role

Modern models (like OpenAI's **o1**, **o3**, and **GPT-4o**) have introduced a specialized `developer` role. This role has higher "Instruction Authority" than the standard `system` role.

NodeLLM **automatically detects** if a model supports this role. If it does, your system instructions are elevated to the `developer` role, making the model significantly more resistant to prompt injection and more likely to follow strict guidelines.

---

## 🔐 Privacy & Data Strategy

- **Stateless Architecture**: NodeLLM is a library, not a service. We do not store, log, or transmit your data to any third-party servers other than the providers you explicitly configure.
- **Local Sovereignty**: Since NodeLLM supports **Ollama**, you can run the entire stack (including security policies) on-premise without ever sending data over the internet.
- **Encapsulated History**: Conversation history is stored in-memory within the `Chat` instance and is only shared with the provider at the moment of a request.
