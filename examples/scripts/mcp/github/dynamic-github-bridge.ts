import { createLLM } from "@node-llm/core";
import { MCP } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * GITHUB MCP EXAMPLE (v1.1)
 * Using the simplified connection helper.
 */
async function run() {
  console.log("--- Starting Simplified @node-llm/mcp GitHub Example ---");

  // 1. Connect to GitHub MCP server in one line
  const mcp = await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "" }
  });

  try {
    // 2. Discover and register tools
    const tools = await mcp.discoverTools({ filter: ["list_issues"] });

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Dynamic discovery with minimal boilerplate.");
    
    const response = await chat.ask("Look up the most recent issue in 'facebook/react'. Just the title.");

    console.log("\n--- AI Response ---");
    console.log(response.content);

  } finally {
    // 3. Cleanup
    await mcp.close();
  }
}

run().catch(console.error);
