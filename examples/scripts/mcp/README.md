# @node-llm/mcp Examples

This directory contains production-ready examples of using the `@node-llm/mcp` package to connect NodeLLM to various Model Context Protocol (MCP) servers.

## 🚀 Examples

### 1. `github/dynamic-github-bridge.ts`
**Category**: Remote API
Connects to GitHub to manage issues, PRs, and repository data.
- **Requirement**: `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env`.
- **Key Feature**: Automatic discovery of tools with prefixing.

### 2. `filesystem/fs-explorer.ts`
**Category**: Local Infrastructure
Allows the AI to read and summarize local files in your project.
- **Key Feature**: Secure local file access within a bounded directory.

### 3. `puppeteer/web-browser.ts`
**Category**: Web Automation
Enables the AI to browse the live web, click elements, and extract data.
- **Key Feature**: Fully autonomous web research capabilities.

## 🛠 How to Run

1. Ensure you are in the project root.
2. Ensure your `.env` has the required provider keys (e.g., `OPENAI_API_KEY`).
3. Run any example using `tsx`:

```bash
npx tsx examples/scripts/mcp/github/dynamic-github-bridge.ts
npx tsx examples/scripts/mcp/filesystem/fs-explorer.ts
npx tsx examples/scripts/mcp/puppeteer/web-browser.ts
```

## 🏗 Why use @node-llm/mcp?

Instead of manual bridge logic, this package provides:
- **Persistent Connections**: Uses a long-lived Stdio transport instead of re-opening for every call.
- **Schema Stabilization**: Automatically fixes third-party JSON schemas for strict LLM providers.
- **Lifecycle Management**: Simple `connect()` and `close()` patterns (Ruby-inspired).
