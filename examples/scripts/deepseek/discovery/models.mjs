import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  console.log("Fetching DeepSeek models...");
  const models = await llm.listModels();

  if (models.length === 0) {
    console.log("No models found.");
  }

  for (const model of models) {
    console.log(`- ${model.id} (${model.provider})`);
    console.log(`  Context Window: ${model.context_window}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
