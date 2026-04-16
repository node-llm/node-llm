import { createLLM, Tool, z } from "../../../../packages/core/src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "dummy-server.mjs");

/**
 * MANUAL BRIDGE WORKAROUND
 * This tool connects to a local SQLite MCP server on-the-fly.
 * 
 * TO RUN THIS:
 * 1. cd examples/scripts/mcp
 * 2. npm install
 * 3. npx tsx manual-bridge.ts
 */
class CodebaseMCPTool extends Tool {
  name = "explore_codebase";
  description = "Use this tool to list files or read code from the @node-llm/core package.";
  schema = z.object({
    action: z.enum(["list", "read"]).describe("Whether to list all files or read a specific one"),
    path: z.string().optional().describe("The relative path to the file (required for 'read' action)")
  });

  async execute({ action, path: filePath }: { action: "list" | "read"; path?: string }) {
    console.log(`\n[MCP] Action: ${action} ${filePath || ""}`);
    
    // Setup transport for our local Code Explorer MCP server
    const transport = new StdioClientTransport({
      command: "node",
      args: [SERVER_PATH]
    });

    const client = new Client(
      { name: "node-llm-explorer-bridge", version: "1.0.0" },
      { capabilities: {} }
    );

    try {
      await client.connect(transport);
      
      let result;
      if (action === "list") {
        result = await client.callTool({ name: "list_source_files", arguments: {} });
      } else {
        result = await client.callTool({ 
          name: "read_source_file", 
          arguments: { relativePath: filePath } 
        });
      }

      return JSON.stringify(result.content);
    } catch (error: any) {
      return `MCP Error: ${error.message}`;
    } finally {
      await transport.close();
    }
  }
}

async function run() {
  const llm = createLLM({ provider: "openai" }); 
  
  const chat = llm.chat("gpt-4o-mini") 
    .withTools([new CodebaseMCPTool()]);

  console.log("--- Starting Meaningful MCP Test ---");
  console.log("Scenario: AI exploring its own Tool implementation via MCP.");
  
  const response = await chat.ask("List the files in the core package, find the one that defines the 'Tool' class, and tell me what the 'execute' method signature is.");
  
  console.log("\n--- Final Analysis ---");
  console.log(response.content);
}

run().catch((err: any) => {
  console.error("Test failed:", err);
  process.exit(1);
});
