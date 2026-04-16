import { createLLM } from "@node-llm/core";
import { MCP } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the path to the MCP package source so we can audit it
const MCP_PACKAGE_PATH = path.resolve(__dirname, "../../../../packages/mcp");

// Load .env for LLM credentials
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * REAL WORLD EXAMPLE: Filesystem Auditor
 * 
 * This script connects node-llm to the official Filesystem MCP Server.
 * It demonstrates how an AI agent can explore and analyze a project's source code
 * using dynamic tool and resource discovery.
 * 
 * TO RUN:
 * npx tsx inspect-mcp.ts
 */
async function run() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Error: OPENAI_API_KEY is missing in .env");
    process.exit(1);
  }

  console.log("--- Real World Explorer: Filesystem Auditor ---");
  console.log(`Target Directory: ${MCP_PACKAGE_PATH}\n`);

  // 1. Connect to the official Filesystem MCP server via npx
  const mcp = await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", MCP_PACKAGE_PATH]
  });

  try {
    // 2. Discover available capabilities
    // The filesystem server provides tools for reading/writing/searching
    const tools = await mcp.discoverTools();
    console.log(`[Registry] Discovered ${tools.length} filesystem tools.`);

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    // 3. Perform a multi-step audit
    console.log("Status: AI is exploring the codebase using the discovered tools...\n");
    
    const response = await chat.ask(
      "Look at the files in the 'src' directory. " +
      "Read 'src/MCP.ts' and explain how the connection lifecycle is managed."
    );

    console.log("--- AI Audit Report ---");
    console.log(response.content);

  } catch (err: any) {
    console.error("Audit Failed:", err.message);
  } finally {
    // 4. Always close the connection to terminate the MCP server process
    await mcp.close();
    console.log("\n[Lifecycle] MCP Connection closed.");
  }
}

run().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
