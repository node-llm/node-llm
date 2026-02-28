import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("xai");
  const chat = llm.chat("grok-3");

  console.log("=== xAI Model Discovery ===\n");

  const models = await llm.listModels();

  console.log(`Found ${models.length} xAI models:\n`);

  // Group by capability
  const chatModels = models.filter((m) => m.capabilities?.includes("chat"));
  const visionModels = models.filter((m) => m.capabilities?.includes("vision"));
  const imageModels = models.filter((m) => m.capabilities?.includes("image_generation"));
  const reasoningModels = models.filter((m) => m.capabilities?.includes("reasoning"));

  console.log(`Chat Models (${chatModels.length}):`);
  chatModels.forEach((m) => console.log(`  - ${m.id} (context: ${m.context_window?.toLocaleString() ?? "?"})`));

  console.log(`\nVision Models (${visionModels.length}):`);
  visionModels.forEach((m) => console.log(`  - ${m.id}`));

  console.log(`\nImage Generation Models (${imageModels.length}):`);
  imageModels.forEach((m) => console.log(`  - ${m.id}`));

  console.log(`\nReasoning Models (${reasoningModels.length}):`);
  reasoningModels.forEach((m) => console.log(`  - ${m.id}`));

  console.log("\n=== Unused default model ===");
  const defaultModel = chat.modelId;
  console.log(`Default model: ${defaultModel}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
