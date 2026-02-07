/**
 * ToolHalt Example - Stop the Agentic Loop Early
 *
 * This example demonstrates how to use `this.halt()` in a tool to
 * immediately stop the agentic execution loop and return a final message.
 *
 * Run: node examples/scripts/core/agents/tool-halt.mjs
 */

import "dotenv/config";
import { Tool, z, createLLM } from "../../../../packages/core/dist/index.js";

// Create an LLM instance
const llm = createLLM({ provider: "openai" });

// ============================================================================
// Example 1: Payment Tool with Amount Limit
// ============================================================================

class PaymentTool extends Tool {
  name = "process_payment";
  description = "Process a payment to a recipient. Returns success or requires approval for large amounts.";
  schema = z.object({
    amount: z.number().describe("Amount in dollars"),
    recipient: z.string().describe("Recipient name or account ID")
  });

  async execute({ amount, recipient }) {
    console.log(`  [PaymentTool] Processing $${amount} to ${recipient}...`);

    // HALT: Large payments require approval
    if (amount > 10000) {
      return this.halt(
        `⚠️ Payment of $${amount.toLocaleString()} to "${recipient}" requires manager approval.\n` +
        `Please contact your supervisor to authorize this transaction.\n` +
        `Reference: PAY-${Date.now()}`
      );
    }

    // HALT: Negative amounts are invalid
    if (amount <= 0) {
      return this.halt(`❌ Invalid payment amount: $${amount}. Amount must be positive.`);
    }

    // Normal execution - continues the agentic loop
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      amount,
      recipient,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// Example 2: Database Query Tool with Safety Limits
// ============================================================================

class DatabaseQueryTool extends Tool {
  name = "query_database";
  description = "Execute a database query. Has safety limits on certain operations.";
  schema = z.object({
    query: z.string().describe("SQL-like query to execute"),
    limit: z.number().optional().describe("Maximum rows to return")
  });

  async execute({ query, limit }) {
    console.log(`  [DatabaseQueryTool] Executing: ${query}`);

    const lowerQuery = query.toLowerCase();

    // HALT: Block destructive operations
    if (lowerQuery.includes("drop") || lowerQuery.includes("delete") || lowerQuery.includes("truncate")) {
      return this.halt(
        `🚫 Destructive database operations are not allowed.\n` +
        `Query "${query}" was blocked for safety reasons.`
      );
    }

    // HALT: Block queries without limits
    if (!limit && lowerQuery.includes("select") && !lowerQuery.includes("limit")) {
      return this.halt(
        `⚠️ Query must include a LIMIT clause or specify a limit parameter.\n` +
        `Unbounded queries are not allowed to prevent performance issues.`
      );
    }

    // Normal execution
    return {
      rows: [
        { id: 1, name: "Sample Row 1" },
        { id: 2, name: "Sample Row 2" }
      ],
      rowCount: 2,
      query
    };
  }
}

// ============================================================================
// Example 3: File Operation Tool with Permission Checks
// ============================================================================

class FileOperationTool extends Tool {
  name = "file_operation";
  description = "Perform file operations like read, write, delete";
  schema = z.object({
    operation: z.enum(["read", "write", "delete"]).describe("Operation type"),
    path: z.string().describe("File path")
  });

  async execute({ operation, path }) {
    console.log(`  [FileOperationTool] ${operation} on ${path}`);

    const protectedPaths = ["/etc", "/system", "/root", "/var/log"];

    // HALT: Check for protected paths
    if (protectedPaths.some(p => path.startsWith(p))) {
      return this.halt(
        `🔒 Access denied to protected path: ${path}\n` +
        `This path is in a protected system directory.`
      );
    }

    // HALT: Confirm destructive operations
    if (operation === "delete") {
      return this.halt(
        `⚠️ Delete operation requires explicit confirmation.\n` +
        `To delete "${path}", please use the confirmation workflow.`
      );
    }

    // Normal execution
    return {
      operation,
      path,
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main() {
  console.log("=== ToolHalt Examples ===\n");
  console.log("ToolHalt allows tools to stop the agentic loop and return immediately.\n");

  // -------------------------------------------------------------------------
  // Example 1: Small Payment (Normal - No Halt)
  // -------------------------------------------------------------------------
  console.log("1️⃣ Small Payment (Normal Execution):");
  console.log("   User: Pay $50 to John\n");

  const chat1 = llm.chat("gpt-4o-mini")
    .withTools([PaymentTool])
    .withInstructions("Help users make payments.");

  const response1 = await chat1.ask("Pay $50 to John");
  console.log(`   Response: ${response1}\n`);

  // -------------------------------------------------------------------------
  // Example 2: Large Payment (Triggers Halt)
  // -------------------------------------------------------------------------
  console.log("2️⃣ Large Payment (Triggers Halt):");
  console.log("   User: Send $25,000 to Acme Corporation\n");

  const chat2 = llm.chat("gpt-4o-mini")
    .withTools([PaymentTool])
    .withInstructions("Help users make payments.");

  const response2 = await chat2.ask("Send $25,000 to Acme Corporation");
  console.log(`   Response: ${response2}\n`);

  // -------------------------------------------------------------------------
  // Example 3: Destructive Database Query (Triggers Halt)
  // -------------------------------------------------------------------------
  console.log("3️⃣ Destructive Query (Triggers Halt):");
  console.log("   User: Delete all records from users table\n");

  const chat3 = llm.chat("gpt-4o-mini")
    .withTools([DatabaseQueryTool])
    .withInstructions("Help users query the database.");

  const response3 = await chat3.ask("Delete all records from users table");
  console.log(`   Response: ${response3}\n`);

  // -------------------------------------------------------------------------
  // Example 4: Protected File Access (Triggers Halt)
  // -------------------------------------------------------------------------
  console.log("4️⃣ Protected File Access (Triggers Halt):");
  console.log("   User: Read the file /etc/passwd\n");

  const chat4 = llm.chat("gpt-4o-mini")
    .withTools([FileOperationTool])
    .withInstructions("Help users with file operations.");

  const response4 = await chat4.ask("Read the file /etc/passwd");
  console.log(`   Response: ${response4}\n`);

  // -------------------------------------------------------------------------
  // Example 5: Valid File Read (Normal - No Halt)
  // -------------------------------------------------------------------------
  console.log("5️⃣ Valid File Read (Normal Execution):");
  console.log("   User: Read the file /home/user/notes.txt\n");

  const chat5 = llm.chat("gpt-4o-mini")
    .withTools([FileOperationTool])
    .withInstructions("Help users with file operations.");

  const response5 = await chat5.ask("Read the file /home/user/notes.txt");
  console.log(`   Response: ${response5}\n`);

  console.log("=== Examples Complete ===");
}

main().catch(console.error);
