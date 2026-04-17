# @node-llm/mcp

**Model Context Protocol (MCP)** support for NodeLLM.

This package turns NodeLLM into a full-featured MCP Host, allowing you to connect your AI agents to hundreds of external servers (GitHub, Postgres, Slack, Google Drive, etc.) using a unified JSON-RPC protocol.

## 🚀 Quick Start

```bash
npm install @node-llm/mcp
```

### 1. Simple Discovery

Connect to a server and automatically register all its tools.

```typescript
import { createLLM } from "@node-llm/core";
import { MCP } from "@node-llm/mcp";

const llm = createLLM();

// Connect and setup logging in one chain
const mcp = (
  await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/docs"]
  })
).onLog((e) => console.log(e.message));

// Discover all tools
const tools = await mcp.discoverTools();

// Use them in a chat
const chat = llm.chat().withTools(tools);
await chat.ask("List the files and summarize the README.md");

// Always close the connection when done
await mcp.close();
```

## 🛠 Features

### 🛰️ Multi-Server Support

Initialize multiple servers concurrently from a central configuration.

```typescript
const mcps = await MCP.connectAll({
  github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
  slack: { url: "https://slack.mcp.example.com/sse" }
});

const tools = [
  ...(await mcps.github.discoverTools({ prefix: "gh_" })),
  ...(await mcps.slack.discoverTools({ prefix: "slack_" }))
];
```

### Event DSL

Register listeners using a clean, chainable API inspired by RubyLLM.

```typescript
mcp
  .onLog(({ level, message }) => console.log(`[${level}] ${message}`))
  .onProgress((p) => console.log(`Step ${p.progress} of ${p.total}`))
  .onError((err) => console.error("Crash:", err));
```

### 🔍 Discovery Types

You can discover capabilities individually or all at once:

**Full Manifest (Unified):**

```typescript
const { tools, resources, prompts } = await mcp.discover();
```

**Granular Discovery:**

```typescript
const tools = await mcp.discoverTools();
const resources = await mcp.discoverResources();
const prompts = await mcp.discoverPrompts();
```

### 🏷 Namespacing

Avoid tool name collisions when connecting to multiple MCP servers by using prefixes.

```typescript
const githubTools = await githubMcp.discoverTools({ prefix: "github_" });
const slackTools = await slackMcp.discoverTools({ prefix: "slack_" });
```

### 📝 Prompt Templates

Resolve server-side prompt templates with arguments:

```typescript
const prompts = await mcp.discoverPrompts({ filter: ["analyze-code"] });
const resolved = await prompts[0].get({ path: "src/index.ts" });
console.log(resolved.messages[0].content.text);
```

### 📂 Resources

Read server-side resources directly:

```typescript
const resources = await mcp.discoverResources();
const readme = resources.find((r) => r.name === "README.md");
const text = await readme.readText(); // Concatenated text content
```

## 🌉 Architecture

The `@node-llm/mcp` package acts as a bridge. It consumes the standardized MCP protocol and translates it into native NodeLLM `Tool` objects and context.

For more details on the internals and real-world patterns, see the **[Official Documentation](https://nodellm.dev/mcp.html)**.

## 📄 License

MIT
