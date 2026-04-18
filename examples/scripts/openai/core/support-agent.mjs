import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

/**
 * Real-world Example: Travel Support AI Agent
 */

// 1. Define a "Real" Tool
class FlightStatusTool extends Tool {
  name = "check_flight_status";
  description = "Get real-time flight status and gate info";
  schema = z.object({ flightNumber: z.string() });

  async handler({ flightNumber }) {
    console.log(`[Tool] Fetching status for ${flightNumber}...`);
    // Simulated API call
    return JSON.stringify({
      flight: flightNumber,
      status: "Delayed",
      gate: "B12",
      newDeparture: "20:45",
      reason: "Weather at destination"
    });
  }
}

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  const chat = llm.chat("gpt-4o-mini");

  // 2. Set strict instructions
  chat.withInstructions(`
    You are a premium travel support agent.
    1. Always check flight status if a flight number is mentioned.
    2. Be empathetic but professional.
    3. If a flight is delayed, propose a visit to a nearby airport lounge.
  `);

  console.log("--- Customer: My flight AA123 is delayed help! ---");

  // 3. Ask a question that triggers a tool and follows instructions
  const response = await chat
    .withTool(FlightStatusTool)
    .ask("I'm at the airport and my flight AA123 seems delayed. Can you check what's going on?");

  console.log("\n--- Agent Response ---");
  console.log(response.content);

  // 4. Demonstrate Structured Output for the next step (e.g., logging to a CRM)
  console.log("\n--- CRM Log Generation (Structured) ---");
  const LogSchema = z.object({
    sentiment: z.enum(["Happy", "Frustrated", "Neutral"]),
    flightMentioned: z.string().nullable(),
    actionTaken: z.string()
  });

  const crmLog = await chat
    .withSchema(LogSchema)
    .ask("Generate a short summary for our internal CRM log based on this interaction.");

  console.log(JSON.stringify(crmLog.parsed, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
