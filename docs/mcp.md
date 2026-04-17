---
layout: default
title: Model Context Protocol (MCP)
nav_order: 6
description: A standardized boundary for discovering and executing tools, resources, and prompt templates across any compliant server.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">1.15.2+</span>
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

`NodeLLM` acts as an **MCP Host**, providing a standardized boundary for discovering and executing tools, resources, and prompt templates across any compliant server. By implementing the MCP specification, NodeLLM decouples your agent's business logic from the specific API nuances of external services.

```bash
npm install @node-llm/mcp
```

---

## Unified Execution Pattern

The unique advantage of MCP in NodeLLM is the ability to orchestrate tools, resources, and prompts in a single cohesive workflow using the fluent Chat API.

```ts
import { MCP } from "@node-llm/mcp";
import { NodeLLM } from "@node-llm/core";

// 1. Initialize the connection
const github = await MCP.connect({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"]
});

// 2. Discover all capabilities (with optional namespacing)
const { tools, resources, prompts } = await github.discover({ prefix: "gh_" });

// 3. Resolve context and expert intent
const reviewPrompt = prompts.find(p => p.name.includes("review"));
const sourceFile = resources.find(r => r.name.includes("MCP.ts"));

// 4. Orchestrate in a single session
const { messages } = await reviewPrompt.get({ 
  code: await sourceFile.readText() 
});

const response = await NodeLLM.chat("gpt-4o")
  .withTools(tools)
  .addMessages(messages)
  .ask("Analyze the code and execute tools to fix any bugs found.");
```

---

## Infrastructure & Monitoring

The `MCP` class provides a clean, event-driven interface for observing server activity.

```ts
const mcp = (await MCP.connect(config))
  .onLog(({ level, message }) => console.log(`[${level}] ${message}`))
  .onProgress(({ progress, total }) => console.log(`Progress: ${progress}/${total}`))
  .onError(err => console.error("Protocol Error:", err));
```

### Multi-Server Orchestration

You can combine tools from multiple servers effortlessly. NodeLLM treats them as pluggable **Tool Sources**.

```ts
const mcps = await MCP.connectAll({
  docs: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./docs"] },
  search: { command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"] }
});

const chat = llm.chat().withTools([
  ...(await mcps.docs.discoverTools()),
  ...(await mcps.search.discoverTools())
]);
```

---

## API Reference

### MCP (The Host)

| Method | Description |
| :--- | :--- |
| `static connect(config)` | Connects to a local server process (Stdio). Accepts `command`, `args`, and `env`. |
| `static connectSSE(config)` | Connects to a remote server (HTTP/SSE). Accepts `url`. |
| `discover(options?)` | Master discovery method. Returns `tools`, `resources`, and `prompts`. |
| `onLog(handler)` | Registers a listener for server logs. |
| `onProgress(handler)` | Registers a listener for progress notifications. |
| `close()` | Gracefully disconnects from the server. |

### MCPResource

| Method | Description |
| :--- | :--- |
| `read()` | Returns the raw `ResourceContent` from the server. |
| `readText()` | Helper to fetch and concatenate all text parts of a resource. |

### MCPPrompt

| Method | Description |
| :--- | :--- |
| `get(args?)` | Resolves the prompt template with arguments and returns `Message[]`. |

---
