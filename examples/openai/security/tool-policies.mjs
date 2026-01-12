import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

// 1. Define a Mock Database Tool
class AdminDBTool extends Tool {
  name = "admin_db";
  description = "Perform database operations. Queries are safe, deletions are sensitive.";
  schema = z.object({
    action: z.enum(["query", "delete"]).describe("The action to perform"),
    table: z.string().describe("Target table name"),
    id: z.string().optional().describe("Record ID for deletion")
  });

  async handler({ action, table, id }) {
    if (action === "query") {
      return `Found 5 records in ${table}`;
    }
    if (action === "delete") {
      return `Successfully deleted record ${id} from ${table}`;
    }
  }
}

async function runExample() {
  // Configure NodeLLM (Reads from .env via dotenv/config)
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  console.log("--- 🕵️ Scenario 1: Dry-Run Mode (Pre-flight Check) ---");
  const dryRunChat = NodeLLM.chat("gpt-4o")
    .withTool(AdminDBTool)
    .withToolExecution("dry-run");

  const plan = await dryRunChat.ask("Delete user #123 from the database");
  console.log("Model Intent:", plan.content);
  console.log("Proposed Tool Calls:", JSON.stringify(plan.tool_calls, null, 2));
  console.log("History size (should be 2: user + plan):", dryRunChat.history.length);
  console.log("\n");

  console.log("--- 🚦 Scenario 2: Confirm Mode (Human-in-the-loop) ---");
  const secureChat = NodeLLM.chat("gpt-4o")
    .withTool(AdminDBTool)
    .withToolExecution("confirm")
    // This is where your security logic or UI approval lives
    .onConfirmToolCall(async (call) => {
      const args = JSON.parse(call.function.arguments);
      console.log(`[APPROVAL REQUIRED] LLM wants to ${args.action} table '${args.table}'`);
      
      // Real-world: This could be a Slack message or a React UI button
      const isSafe = args.action === "query";
      console.log(`Decision: ${isSafe ? "✅ Auto-approving query" : "❌ Rejecting deletion for security"}`);
      return isSafe;
    })
    // High-fidelity auditing
    .onToolCallStart((call) => console.log(`[AUDIT] Starting: ${call.function.name}`))
    .onToolCallEnd((call, res) => console.log(`[AUDIT] Success: Result: ${res}`))
    .onToolCallError((call, err) => console.error(`[AUDIT] Failed: ${err.message}`));

  console.log("\n> User asks for a safe query:");
  const res1 = await secureChat.ask("How many users are in the database?");
  console.log("AI Response:", res1.content);

  console.log("\n> User asks for a dangerous deletion:");
  const res2 = await secureChat.ask("Now delete record #999");
  console.log("AI Response:", res2.content);
}

runExample().catch(console.error);
