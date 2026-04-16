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
 * STEP-BY-STEP AGENT PATTERN
 * Demonstrates how to build an agent that executes discrete steps,
 * with visibility into each decision and action.
 *
 * This agent architecture shows:
 * - Tool selection and execution
 * - State management between steps
 * - Clear reasoning traces
 * - Error recovery
 */
interface AgentStep {
  stepNumber: number;
  objective: string;
  toolsUsed: string[];
  result: string;
  nextStep?: string;
}

class SimpleAgent {
  private steps: AgentStep[] = [];
  private stepCounter = 0;

  async executeStep(
    chat: any,
    objective: string,
    context: string
  ): Promise<AgentStep> {
    this.stepCounter++;

    const systemPrompt = `You are a focused agent. Current context:
${context}

Your objective for this step:
${objective}

Be concise and direct. After completing this step, suggest what the next step should be.`;

    console.log(`\n[Step ${this.stepCounter}] ${objective}`);

    const response = await chat.ask(systemPrompt);
    const content = response.content;

    // Extract tool calls if any
    const toolsUsed = response.toolCalls
      ? response.toolCalls.map((call: any) => call.name)
      : [];

    const step: AgentStep = {
      stepNumber: this.stepCounter,
      objective,
      toolsUsed,
      result: content
    };

    this.steps.push(step);

    console.log(`[Result] ${content.substring(0, 150)}...`);
    if (toolsUsed.length > 0) {
      console.log(`[Tools Used] ${toolsUsed.join(", ")}`);
    }

    return step;
  }

  getSummary(): string {
    return `
=== AGENT EXECUTION SUMMARY ===
Total Steps: ${this.steps.length}
Steps Completed:
${this.steps.map((s) => `  ${s.stepNumber}. ${s.objective}`).join("\n")}
`;
  }
}

async function run() {
  console.log("=== Step-by-Step Agent Pattern ===");

  const dbPath = path.resolve(process.cwd(), "step-agent.db");

  // Cleanup
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  console.log("[Agent] Initializing...\n");

  // Setup SQLite for operations
  const registry = await MCPRegistry.connect({
    command: findExecutable("uvx"),
    args: ["mcp-server-sqlite", "--db-path", dbPath]
  });

  try {
    const tools = await registry.discoverTools();
    console.log(`[Tools] Discovered ${tools.length} database tools\n`);

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    const agent = new SimpleAgent();

    // Step 1: Initialize data store
    await agent.executeStep(
      chat,
      `Create a 'products' table with columns: id, name, category, price, stock.
       Report success when done.`,
      "No database setup yet. Need to create schema."
    );

    // Step 2: Populate with initial data
    await agent.executeStep(
      chat,
      `Insert 5 different products with various categories and prices.
       Suggest a mix of electronics, clothing, and food items.`,
      "Database schema created. Ready to populate with products."
    );

    // Step 3: Query and analyze
    await agent.executeStep(
      chat,
      `Query the products table and find:
       - Most expensive item
       - How many items are in each category
       - Average price per category`,
      "Database populated with 5 products. Need to analyze the data."
    );

    // Step 4: Create summary
    await agent.executeStep(
      chat,
      `Based on the data analysis, create an executive summary about the inventory:
       - Total categories represented
       - Price range
       - Recommendations for the next 3 products to add`,
      "Data analysis complete. Ready to create summary and recommendations."
    );

    // Print summary
    console.log(agent.getSummary());

    console.log("[Agent] All steps completed successfully!");
  } catch (err) {
    console.error("Agent Error:", err);
  } finally {
    console.log("\n[Cleanup] Closing connection...");
    await registry.close();

    // Cleanup
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  }
}

run();
