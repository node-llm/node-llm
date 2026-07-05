---
layout: default
title: Model Context Protocol (MCP)
nav_order: 6
description: A standardized boundary for discovering and executing tools, resources, and prompt templates across any compliant server.
---

# {{ page.title }} <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.15.2+</span>
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
const { tools, resources, resourceTemplates, prompts } = await github.discover({ prefix: "gh_" });

// 3. Resolve context and expert intent
const reviewPrompt = prompts.find(p => p.name.includes("review"));
const sourceFile = resources.find(r => r.name.includes("MCP.ts"));

// 4. Orchestrate in a single session
const { messages } = await reviewPrompt.get({ 
  code: await sourceFile.readText() 
});

const response = await NodeLLM.chat("gpt-5")
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

## Sampling <span style="background-color: #0d9488; color: white; padding: 1px 6px; border-radius: 3px; font-size: 0.65em; font-weight: 600; vertical-align: middle;">v1.17.0+</span>

Sampling inverts the usual direction of MCP: instead of the client asking the server for tools, the **server** asks the **client** to run an LLM completion on its behalf (`sampling/createMessage`). This lets a server offer LLM-powered functionality without holding its own API key — the client decides which model actually answers.

By default `MCP` does not support sampling. Pass a `sampling` handler when connecting to opt in — the `sampling` capability is only advertised to the server once a handler is configured, so servers correctly hide sampling-dependent tools until you do.

```ts
import { MCP, createLLMSamplingHandler } from "@node-llm/mcp";
import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "openai" });

const mcp = await MCP.connect(
  { command: "npx", args: ["-y", "some-server-that-uses-sampling"] },
  { sampling: createLLMSamplingHandler(llm, "gpt-5-mini") }
);
```

`createLLMSamplingHandler` replays the server's request (messages, system prompt, temperature, max tokens) as a NodeLLM chat and maps the response back into the shape the server expects. For full control over the request/response — routing to different models, adding a human-in-the-loop approval step, etc. — pass your own handler function instead:

```ts
const mcp = await MCP.connect(config, {
  sampling: async (request) => {
    // request.messages, request.systemPrompt, request.maxTokens, ...
    const chat = llm.chat("gpt-5-mini").withTemperature(request.temperature ?? 1);
    const response = await chat.ask(request.messages.at(-1)?.content as string);
    return { model: response.model, role: "assistant", content: { type: "text", text: response.content } };
  }
});
```

**Note**: Multimodal sampling requests (image/audio content blocks) are not yet supported — only text content is extracted from request messages.

---

## API Reference

### MCP (The Host)

| Method | Description |
| :--- | :--- |
| `static connect(config, options?)` | Connects to a local server process (Stdio). Accepts `command`, `args`, and `env`. `options.sampling` configures a [sampling](#sampling-v1170) handler. |
| `static connectSSE(config, options?)` | Connects to a remote server (HTTP/SSE). Accepts `url`. |
| `static connectAll(config, options?)` | Connects to multiple named servers at once. Returns a map of server name → `MCP` instance. |
| `discover(options?)` | Master discovery method. Returns `tools`, `resources`, `resourceTemplates`, and `prompts`. |
| `discoverTools(options?)` | Discovers only tools. Returns `MCPTool[]`. |
| `discoverResources(options?)` | Discovers only resources. Returns `MCPResource[]`. |
| `discoverResourceTemplates(options?)` | Discovers only resource templates. Returns `MCPResourceTemplate[]`. |
| `discoverPrompts(options?)` | Discovers only prompts. Returns `MCPPrompt[]`. |
| `onLog(handler)` | Registers a listener for server logs. |
| `onProgress(handler)` | Registers a listener for progress notifications. |
| `onError(handler)` | Registers a listener for protocol errors. |
| `onNotification(handler)` | Registers a listener for generic protocol notifications. |
| `close()` | Gracefully disconnects from the server. |

Each `discover*` method accepts a `DiscoveryOptions` object: `filter` (only include items with these names) and `prefix` (prepend a namespace to discovered names, e.g. `"gh_"`).

### MCPResource

| Method | Description |
| :--- | :--- |
| `read()` | Returns the raw `ResourceContent` from the server. |
| `readText()` | Helper to fetch and concatenate all text parts of a resource. |

### MCPResourceTemplate

| Property / Method | Description |
| :--- | :--- |
| `name`, `description`, `uriTemplate`, `mimeType` | Metadata describing the template. |
| `resolve(args)` | Substitutes `{placeholders}` in the URI template and returns a concrete `MCPResource`. |

### MCPPrompt

| Method | Description |
| :--- | :--- |
| `get(args?)` | Resolves the prompt template with arguments and returns the server's prompt result (`{ description?, messages }`). |

---
