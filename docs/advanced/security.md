---
layout: default
title: Security & Compliance
parent: Advanced
nav_order: 1
permalink: /advanced/security
description: Learn how NodeLLM acts as an architectural security layer with context isolation, content filtering, human-in-the-loop tool execution, and resource limits.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.5.0+</span>
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

Calling the same hook (e.g. `onToolCallStart`) more than once registers an **additional** handler rather than replacing the previous one <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.17.0+</span> — so independent security layers (e.g. a compliance audit log and a separate anomaly detector) can each register their own hook without silently dropping the other's. `onConfirmToolCall` is the one exception: when multiple handlers are registered, **every** one of them must approve for the call to proceed.

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

The timeout covers the whole call, including reading the response body. Some providers send their headers at once and then hold the body open while the model works. A timeout that stopped at the headers would never fire for them. For a stream, the timeout covers the wait for the first response, not the stream itself.

**Security Benefits:**

- **Prevents Destructive Actions**: Stops the model from accidentally deleting data without oversight.
- **Human-in-the-loop**: Increases trust by ensuring critical business logic remains under human control.

**Note on concurrency:** independent tool calls in the same turn can optionally run in parallel via `toolConcurrency` / `chat.withToolConcurrency()`. In `confirm` mode, execution always stays sequential since approval is interactive — see the [Tools guide](/core-features/tools.html#concurrent-tool-execution) for details.

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

## 📂 Loading Files Safely

`images` and `files`, Gemini's and OpenAI's image inputs, and transcription files take local paths and URLs. With no setup, NodeLLM refuses the ones that are only ever an attack:

- **Files that hold secrets:** `.env` files in any form (`.env`, `.env.production`, `.env-local`, `prod.env`, `.envrc`), `.npmrc`, `.netrc`, `.pgpass`, `.my.cnf`, `.git-credentials`, `.vault-token`, SSH keys (`id_rsa`, `id_rsa_work`, ...), cloud credentials (`credentials`, `application_default_credentials.json`, `*service-account*.json`), `secrets.yml`, `database.yml`, `terraform.tfstate`, anything in `.ssh`, `.aws`, `.azure`, `.gnupg`, `.kube`, `.docker` or `.git`, keys and certificates (`.pem`, `.key`, `.p12`, `.pfx`, ...), and `/proc`, `/sys` and `/dev`. A link to one of these is refused too.
- **Files that aren't files:** devices, pipes and sockets, and files over 100 MB.
- **Cloud metadata addresses:** `169.254.x.x`, `192.0.0.192` (Oracle), `100.100.100.200` (Alibaba), `fd00:ec2::254` and `metadata.google.internal`, including IPv6 forms that carry them (`[::ffff:169.254.169.254]`, NAT64). The address is checked when the connection is made, on every redirect, so DNS that answers differently the second time (rebinding) can't reach them.
- **Slow or huge remote files:** a remote file times out after 60 seconds and is stopped at 50 MB while it is read.

Ordinary files, files with no extension such as a `Dockerfile`, and other private hosts (`localhost`, an internal CDN) load as before. A refused file or URL throws `FileAccessError`.

When a path or URL can come from a user, add rules with `fileSecurity`:

```ts
const llm = createLLM({
  fileSecurity: {
    root: "/srv/uploads", // local files must be inside this folder, after following links
    blockPrivateNetwork: true, // refuse every private, loopback and link-local address
    allowedHosts: ["cdn.example.com"], // only these hosts may be fetched
    throwOnFetchError: true, // throw instead of passing a URL that failed on to the provider
    fetchTimeout: 10_000 // default 60000
  }
});
```

Set it on `config`, in `createLLM()`, or per chat with `llm.chat(model, { fileSecurity })`; a chat's rules are added to the ones from `config` and `createLLM()`, overriding only the ones it sets. Provider-level loaders (Gemini and OpenAI images, transcription) use the rules from `config`. `allowSensitiveFiles: true` loads secret files again, for the rare app that means to send them.

When your app replaces `fetch` (a test mock, a recorder) or sets its own fetch dispatcher (a proxy), remote files go through it as before; addresses are then checked by a lookup before each request, which a host that changes its DNS answer can get past.

---

## 🔑 Keys Stay Out of Logs and Errors

- **Gemini keys go in a header.** The key is sent as `x-goog-api-key`, not as `?key=` in the URL, so proxies, tracing and error reports that record URLs never see it.
- **Debug logs are masked.** With `debug: true`, request and response bodies are printed with values that look like keys or tokens (`sk-...`, `AIza...`, `Bearer ...`) and fields such as `api_key` or `authorization` replaced by `[REDACTED]`, and base64 files replaced by their size. Prompts and answers are still printed, since that is what debug logging is for: don't turn it on in production for user data.
- **Provider errors are masked.** An `APIError`'s `message` and `body` mask key-like values the same way, so showing or logging the error doesn't leak a key or its ID. `redactForLog()` is exported for your own logs.

---

## 🧰 Tool Calls

- **Arguments are checked against the tool's schema.** A tool defined with a JSON Schema, including `Tool` classes with one and MCP tools, no longer receives arguments its schema rules out: a missing required field, a wrong type, a value outside an `enum`, or an extra field where the schema says `additionalProperties: false`. The model gets `Invalid tool arguments: ...` and can try again. Tools with a Zod schema are checked by Zod as before, so coercions and defaults still work. Keywords the check doesn't know, such as `format` or `minimum`, are not enforced: check those in the handler.
- **Tool errors are masked and cut short.** When a tool throws, the model is told the error's message with key-like values and passwords in URLs masked, cut to 500 characters. Other details, such as file paths or hostnames in your messages, are still sent: throw messages written for the model.
- **Hidden tools stay hidden.** When the model calls a tool that doesn't exist, the reply lists only the tools it can already see, not deferred ones.

---

## 🪆 Subagents

An agent used as a tool runs inside its parent's ask:

- **Its spending is the parent's.** Every request a subagent makes is added to the parent ask's `usage`, and the subagent stops once an ask above it has reached its `maxCost`, so a limit on the top agent caps the whole tree.
- **Nesting is limited.** Subagents may nest 8 deep. An agent that keeps handing the task to itself, or two that hand it to each other, gets `AgentDepthError` at the ninth level, which reaches the model as a tool error.

---

## ⚡ Smart Developer Role

Modern models (like OpenAI's **o1**, **o3**, and **GPT-4o**) have introduced a specialized `developer` role. This role has higher "Instruction Authority" than the standard `system` role.

NodeLLM **automatically detects** if a model supports this role. If it does, your system instructions are elevated to the `developer` role, making the model significantly more resistant to prompt injection and more likely to follow strict guidelines.

---

## 🔐 Privacy & Data Strategy

- **Stateless Architecture**: NodeLLM is a library, not a service. We do not store, log, or transmit your data to any third-party servers other than the providers you explicitly configure.
- **Local Sovereignty**: Since NodeLLM supports **Ollama**, you can run the entire stack (including security policies) on-premise without ever sending data over the internet.
- **Encapsulated History**: Conversation history is stored in-memory within the `Chat` instance and is only shared with the provider at the moment of a request.
