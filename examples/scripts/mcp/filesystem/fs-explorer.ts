import { createLLM } from "@node-llm/core";
import { MCP } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * FILESYSTEM MCP EXAMPLE
 * Demonstrates the AI's ability to explore and read local files
 * autonomously using the @node-llm/mcp bridge.
 */
async function run() {
  console.log("--- Starting @node-llm/mcp Filesystem Explorer ---");

  // we give it access to the actual project root (4 levels up from this script)
  const projectRoot = path.resolve(__dirname, "../../../../");

  // 1. Connect to the Filesystem MCP server
  // We use npx to run the official server-filesystem
  const mcp = await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", projectRoot]
  });

  try {
    // 2. Discover tools (read_file, list_directory, etc.)
    const tools = await mcp.discoverTools();
    console.log(`[Registry] Discovered ${tools.length} filesystem tools.`);

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Self-Discovery. The AI will look at its own architecture docs.");
    
    // We provide a hint about where the docs are
    const response = await chat.ask(
        "There is an 'ARCHITECTURE.md' file inside 'packages/mcp/'. " +
        "Please read it and summarize the 'Bridge Pattern' section for me."
    );

    console.log("\n--- AI Response ---");
    console.log(response.content);

  } catch (err) {
    console.error("Operation failed:", err);
  } finally {
    // 3. Cleanup
    await mcp.close();
    console.log("\n[Lifecycle] MCP Connection closed.");
  }
}

run().catch(console.error);
