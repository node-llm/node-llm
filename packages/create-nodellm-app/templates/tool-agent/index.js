import { NodeLLM, Tool } from "@node-llm/core";
import { z } from "zod";
import { createInterface } from "node:readline/promises";

// A tool is a class with a name, a description, a Zod schema and an execute() method.
// NodeLLM sends the schema to the model and runs execute() whenever the model calls it.
class OrderStatusTool extends Tool {
  name = "get_order_status";
  description = "Look up the shipping status of a customer order";
  schema = z.object({
    orderId: z.string().describe("The order number, e.g. A-1001")
  });

  async execute({ orderId }) {
    // Replace this with a call to your database or API.
    const orders = { "A-1001": "shipped", "A-1002": "processing" };
    return { orderId, status: orders[orderId] ?? "not found" };
  }
}

const chat = NodeLLM.chat(process.env.NODELLM_MODEL || undefined)
  .withInstructions("You are a friendly support agent for an online store. Keep answers short.")
  .withTool(new OrderStatusTool());

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log('Ask about an order (try "Where is order A-1001?"). Press Ctrl+C to quit.\n');

rl.setPrompt("> ");
rl.prompt();

for await (const question of rl) {
  if (question.trim()) {
    try {
      const reply = await chat.ask(question);
      console.log(`\n${reply.content}\n`);
    } catch (error) {
      console.error(`\nRequest failed: ${error.message}`);
      console.error("Check NODELLM_PROVIDER, NODELLM_MODEL and your API key in .env.\n");
    }
  }
  rl.prompt();
}
