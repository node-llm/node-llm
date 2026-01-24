import "dotenv/config";
import { createLLM, NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });

  // 1. List Available Bedrock Models
  console.log("--- Listing Bedrock Foundation Models ---");
  console.log("Region:", process.env.AWS_REGION || "us-east-1");
  
  try {
    const models = await llm.listModels();
    console.log(`Found ${models.length} supported models.\n`);
    
    console.table(
      models.map((m) => ({
        ID: m.id,
        Name: m.name,
        Context: m.context_window || "Unknown",
        Streaming: m.metadata?.streaming_supported ? "Yes" : "No"
      }))
    );

    // 2. Inspect a specific model
    const defaultModel = "anthropic.claude-3-5-haiku-20241022-v1:0";
    console.log(`\n--- Inspecting '${defaultModel}' ---`);
    const model = models.find(m => m.id === defaultModel || m.metadata?.bedrock_model_id === defaultModel);

    if (model) {
      console.log(`Name: ${model.name}`);
      console.log(`Context Window: ${model.context_window}`);
      console.log(`Capabilities: ${model.capabilities.join(", ")}`);
      console.log(`Modalities: ${model.modalities.input.join("/")} -> ${model.modalities.output.join("/")}`);
      if (model.pricing) {
        console.log(`Pricing (Input/Output 1M): $${model.pricing.text_tokens?.standard?.input_per_million} / $${model.pricing.text_tokens?.standard?.output_per_million}`);
      }
    }
  } catch (error) {
    console.error("\nError listing models:", error.message);
    if (error.message.includes("403")) {
      console.log("\nTIP: Ensure your IAM user/role has 'bedrock:ListFoundationModels' permission.");
    }
  }
}

main().catch(console.error);
