# MCP Examples (Workaround Patterns)

This directory contains Proof-of-Concept (PoC) demonstrations of how to connect `node-llm` to [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers.

## ⚠️ Important Note
These are **workaround patterns**. They are designed for low-traffic CLI tools and testing.
- **Official Support**: We are currently building a first-class `@node-llm/mcp` package for persistent, high-performance connections.

## Project Structure

### 1. `core-explorer/`
A real-world demo where the AI uses a local MCP server to explore its own source code.
- **Included**: `dummy-server.mjs` (the explorer server), `manual-bridge.ts` (the bridge).
- **Run**: 
  ```bash
  cd examples/scripts/mcp/core-explorer
  npm install
  npx tsx manual-bridge.ts
  ```

### 2. `github/`
A demo connecting `node-llm` to the official GitHub MCP server to fetch live repository data.
- **Included**: `github-bridge.ts`.
- **Requirement**: A `GITHUB_PERSONAL_ACCESS_TOKEN` in the local `.env`.
- **Run**:
  ```bash
  cd examples/scripts/mcp/github
  npm install
  npx tsx github-bridge.ts
  ```

## Rationale (The Bridge Pattern)

The bridge scripts demonstrate how to wrap the `@modelcontextprotocol/sdk` inside a standard Node-LLM `Tool`. This allows the LLM to autonomously call MCP tools via a standard `Chat` loop.
