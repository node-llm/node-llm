import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  console.log("--- Model Discovery ---");
  const models = await NodeLLM.listModels();
  
  console.log(`Found ${models.length} models.`);
  console.log("First 5 models:");
  models.slice(0, 5).forEach(m => {
    console.log(`- ${m.id} (${m.name})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
