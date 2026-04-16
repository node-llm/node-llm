import { createLLM } from "@node-llm/core";
import { MCPRegistry } from "../../../../packages/mcp/src/index.js";
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
    return execSync(`which ${name}`, { encoding: "utf8" }).trim();
  } catch {
    const commonPaths = [
      path.join(process.env.HOME || "", ".local", "bin", name),
      path.join("/usr", "local", "bin", name),
      path.join("/usr", "bin", name),
      path.join("/bin", name)
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
 * MULTI-TOOL AGENT EXAMPLE
 * Demonstrates a sophisticated agent that combines multiple MCP servers
 * (filesystem and SQLite) to accomplish a complex task.
 *
 * The agent:
 * 1. Explores the codebase structure using filesystem tools
 * 2. Creates and populates a database with findings
 * 3. Queries and analyzes the collected data
 * 4. Reports insights back
 */
async function run() {
  console.log("=== Multi-Tool Agent Flow ===\n");

  const dbPath = path.resolve(process.cwd(), "agent-analysis.db");
  const workDir = path.resolve(__dirname, "../../../../packages/mcp");

  // Cleanup
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  console.log("[Agent] Initializing tool registries...\n");

  // 1. Setup filesystem tools
  const fsRegistry = await MCPRegistry.connect({
    command: findExecutable("npx"),
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      workDir
    ]
  });

  // 2. Setup SQLite tools
  const dbRegistry = await MCPRegistry.connect({
    command: findExecutable("uvx"),
    args: ["mcp-server-sqlite", "--db-path", dbPath]
  });

  try {
    // Discover tools from both registries
    const fsTools = await fsRegistry.discoverTools({ prefix: "fs_" });
    const dbTools = await dbRegistry.discoverTools({ prefix: "db_" });

    console.log(`[Tools] Discovered ${fsTools.length} filesystem tools`);
    console.log(`[Tools] Discovered ${dbTools.length} database tools\n`);

    // Combine all tools
    const allTools = [...fsTools, ...dbTools];

    // Create LLM with all tools
    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(allTools);

    console.log("[Agent] Starting reasoning workflow...\n");

    // Step 1: Explore codebase
    console.log("--- Step 1: Codebase Exploration ---");
    const exploreResponse = await chat.ask(
      `Using the filesystem tools, explore the TypeScript files in the current directory. 
       List the main files (*.ts) and their purposes. Be concise.`
    );
    console.log("Agent Response:", exploreResponse.content);
    console.log();

    // Step 2: Create database schema
    console.log("--- Step 2: Database Setup ---");
    const setupResponse = await chat.ask(
      `Create a database schema to store information about TypeScript files.
       Create a table called 'ts_files' with columns: id (integer), 
       filename (text), path (text), size (integer), description (text).
       Return confirmation when done.`
    );
    console.log("Agent Response:", setupResponse.content);
    console.log();

    // Step 3: Gather file information
    console.log("--- Step 3: File Analysis ---");
    const analysisResponse = await chat.ask(
      `Using filesystem tools, list all TypeScript files (*.ts) in the current directory.
       For each file, collect: filename, relative path, and estimated size.
       Then insert these records into the ts_files table. 
       Insert at least 3-5 files if available, leaving description as NULL for now.`
    );
    console.log("Agent Response:", analysisResponse.content);
    console.log();

    // Step 4: Query and analyze
    console.log("--- Step 4: Data Analysis ---");
    const queryResponse = await chat.ask(
      `Query the ts_files table and provide statistics:
       - Total number of files
       - Average file size
       - List of all files found
       Then provide a brief summary of the codebase structure.`
    );
    console.log("Agent Response:", queryResponse.content);
    console.log();

    // Step 5: Generate insights
    console.log("--- Step 5: Agent Insights ---");
    const insightResponse = await chat.ask(
      `Based on the data you've collected, what can you infer about this package structure?
       Consider: number of files, organization, and typical file sizes.
       What does this tell us about the project?`
    );
    console.log("Agent Response:", insightResponse.content);
    console.log();

    console.log("[Agent] Workflow completed successfully!");
  } catch (err) {
    console.error("Agent Error:", err);
  } finally {
    console.log("\n[Cleanup] Closing connections...");
    await fsRegistry.close();
    await dbRegistry.close();

    // Cleanup
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    console.log("[Cleanup] Done");
  }
}

run();
