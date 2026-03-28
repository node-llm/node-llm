import { Agent, Tool, z, createLLM, SchemaSelfCorrection } from "@node-llm/core";
import "dotenv/config";

// 1. Define a tool with strict validation
// If the LLM sends 'amount' as a string, this tool will throw a ZodError
class PaymentTool extends Tool {
  name = "process_payment";
  description = "Process a payment for a user";
  schema = z.object({
    userId: z.string(),
    amount: z.number().positive(),
  });

  async execute({ userId, amount }) {
    console.log(`[Tool] Processing $${amount} for ${userId}...`);
    return { success: true, transactionId: "tx_123" };
  }
}

// 2. Define a Robust Agent
// We use SchemaSelfCorrection to handle hallucinations in tool arguments
class BillingAgent extends Agent {
  static model = "gpt-4o-mini"; // Works with any provider: claude, gemini, etc.
  static instructions = "You are a billing assistant. Always use the process_payment tool.";
  static tools = [PaymentTool];
  static middlewares = [
    SchemaSelfCorrection({ maxRetries: 2 })
  ];
}

async function main() {
  const llm = createLLM({ provider: "openai" });
  const agent = new BillingAgent({ llm });

  console.log("--- Sending request that might require correction ---");
  
  // We ask it to process a payment. Some models might try to send 
  // the amount as "100" (string) instead of 100 (number).
  const response = await agent.ask("Process a payment of 100 dollars for user 'alice'");

  console.log("\nFinal Response:", response.content);
  console.log("Total Tokens:", agent.totalUsage.total_tokens);
}

main().catch(console.error);
