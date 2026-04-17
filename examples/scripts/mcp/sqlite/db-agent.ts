import { createLLM } from "@node-llm/core";
import { MCP } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Find the path to an executable in PATH
 */
function findExecutable(name: string): string {
  try {
    return execSync(`which ${name}`, { encoding: 'utf8' }).trim();
  } catch {
    // Fallback to common locations
    const commonPaths = [
      path.join(process.env.HOME || '', '.local', 'bin', name),
      path.join('/usr', 'local', 'bin', name),
      path.join('/usr', 'bin', name),
      path.join('/bin', name)
    ];
    
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    throw new Error(`Executable '${name}' not found in PATH or common locations`);
  }
}

/**
 * SQLITE MCP EXAMPLE
 * Demonstrates an AI data analyst using @node-llm/mcp.
 */
async function run() {
  console.log("--- Starting @node-llm/mcp SQLite Analyst ---");

  const dbPath = path.resolve(process.cwd(), "test-mcp.db");
  
  // 0. Ensure a clean test DB exists for the demo
  console.log(`[Setup] Creating demo database at ${dbPath}...`);
  // (In a real scenario, you'd use an existing DB)

  // 1. Connect to SQLite MCP server
  const mcp = await MCP.connect({
    command: findExecutable("uvx"),
    args: ["mcp-server-sqlite", "--db-path", dbPath]
  });

  try {
    const tools = await mcp.discoverTools();
    console.log(`[Registry] Discovered ${tools.length} database tools.`);

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Initializing a table and querying it.");
    
    // We let the AI manage the schema creation
    const response = await chat.ask(
        "Please create a table named 'products' with 'id', 'name', and 'price'. " +
        "Insert 3 sample items (Laptop, Mouse, Keyboard) with random prices. " +
        "Finally, run a query to show me the most expensive item."
    );

    console.log("\n--- AI Response ---");
    console.log(response.content);

  } catch (err) {
    console.error("Database Interaction Error:", err);
  } finally {
    await mcp.close();
    // Cleanup the test DB
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    console.log("\n[Lifecycle] MCP Connection closed and DB cleaned up.");
  }
}

run().catch(console.error);
