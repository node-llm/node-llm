import { createLLM } from "../../../../packages/core/src/index.js";
import { MCPRegistry } from "../../../../packages/mcp/src/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * GITHUB MCP EXAMPLE (v1.0)
 * Demonstrates using the official @node-llm/mcp package to
 * autonomously discover and use tools from a remote server.
 */
async function run() {
  console.log("--- Starting @node-llm/mcp GitHub Example ---");

  // 1. Initialize the Stdio Transport for the GitHub server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    }
  });

  // 2. Use the MCPRegistry to connect and discover tools
  const mcp = new MCPRegistry(transport);

  console.log("[Registry] Probing GitHub MCP server...");

  try {
    // We can use prefixes to avoid collisions if we had multiple servers
    const tools = await mcp.discover({ 
        prefix: "gh_",
        filter: ["list_issues"] // In this demo we filter for stability, but we could list all
    });

    console.log(`[Registry] Successfully discovered ${tools.length} tools.`);

    const llm = createLLM({ provider: "openai" });
    
    // 3. Inject the discovered tools into the NodeLLM chat session
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Dynamic discovery using @node-llm/mcp package.");
    
    const response = await chat.ask("Look up the most recent issue in 'facebook/react' using your GitHub tools. Just tell me the title of the first one.");

    console.log("\n--- AI Response ---");
    console.log(response.content);

  } catch (err) {
    console.error("Discovery Error:", err);
  } finally {
    // 4. Always close the registry to cleanup child processes
    await mcp.close();
    console.log("\n[Lifecycle] MCP Connection closed.");
  }
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
