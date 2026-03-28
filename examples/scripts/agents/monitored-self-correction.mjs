import { createLLM, Agent, SchemaSelfCorrection, z } from "@node-llm/core";
import { Monitor } from "@node-llm/monitor";
import dotenv from "dotenv";

dotenv.config();

const monitor = Monitor.memory({ captureContent: true });

// A dynamic schema that fails the first few times
let validationAttempts = 0;
const dynamicSchema = z.object({
  answer: z.string().refine(val => {
    validationAttempts++;
    console.log(`   [Zod] Validation Attempt ${validationAttempts} for "${val}"`);
    if (validationAttempts <= 2) {
      return false; // Fail the first two times
    }
    return true; // Pass from the 3rd time onwards
  }, "Demo Error: This schema is programmed to fail the first two times to trigger Self-Correction.")
});

export class TrialAgent extends Agent {
  static model = "gpt-4o-mini";
  static instructions = "You are a testing assistant. Please respond with the word 'PASSED'.";
  static schema = dynamicSchema;
  
  static middlewares = [
    SchemaSelfCorrection({ maxRetries: 5 }),
    monitor
  ];
}

async function run() {
  const llm = createLLM({ 
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  
  const agent = new TrialAgent({ llm });

  console.log("🚀 Starting Programmatic Self-Correction Demo...");
  console.log("   (Schema is set to fail twice, then pass)\n");

  try {
    const response = await agent.ask("Status check?");
    
    console.log("\n✅ Final Result:", JSON.stringify(response.data));
    
    const stats = await monitor.getStore().getStats();
    const traces = await monitor.getStore().listTraces({ limit: 1 });
    const lastTrace = traces.items[0];

    console.log("\n--- Monitor Analytics ---");
    console.log(`📊 Total Requests: ${stats.totalRequests}`);
    console.log(`✨ Self-Corrections Managed: ${stats.totalSelfCorrections || 0}`);
    console.log(`🔄 Correction Rounds for this trace: ${lastTrace.correctionRounds || 0}`);
    
    if (lastTrace && lastTrace.correctionRounds && lastTrace.correctionRounds > 0) {
      console.log(`💡 SUCCESS: Middleware steered the Agent through ${lastTrace.correctionRounds} rounds of failure.`);
    }

    const events = await monitor.getStore().getEvents(lastTrace.requestId);
    console.log("\n--- Event Timeline ---");
    events.forEach(e => {
        const payloadStr = JSON.stringify(e.payload);
        console.log(`[${new Date(e.time).toLocaleTimeString()}] ${e.eventType}: ${payloadStr.substring(0, 100)}...`);
    });

  } catch (err) {
    console.error("\n❌ Agent failed:", err.message);
  }
}

run();
