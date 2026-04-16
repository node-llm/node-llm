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

// Connect to the official Filesystem MCP server
const mcp = await MCP.connect({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/docs"]
});

// Discover all tools
const tools = await mcp.discoverTools();

// Use them in a chat
const chat = llm.chat().withTools(tools);
await chat.ask("List the files and summarize the README.md");

// Always close the connection when done
await mcp.close();
```

## 🛠 Features

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
const content = await readme.read();
```

## 🌉 Architecture

The `@node-llm/mcp` package acts as a bridge. It consumes the standardized MCP protocol and translates it into native NodeLLM `Tool` objects and context.

For more details on the internals and real-world patterns, see the **[Official Documentation](https://nodellm.dev/core-features/mcp)**.

## 📄 License

MIT
