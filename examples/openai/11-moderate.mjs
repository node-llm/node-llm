import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

async function main() {
  // Configure a default moderation model globally
  LLM.configure({ 
    provider: "openai",
    defaultModerationModel: "omni-moderation-latest" 
  });

  const input = "I want to hurt someone and steal their money";
  console.log(`Moderating with global default: "${input}"`);
  
  // 1. Use the specifically requested model (overriding any default)
  console.log(`\nModerating with specific model override: "${input}"`);
  const result = await LLM.moderate(input, { 
    model: "omni-moderation-latest" 
  });
  console.log(`Model used: ${result.model}`);

  // 2. Check overall flagging status
  if (result.flagged) {
    console.log(`❌ Content was flagged for: ${result.flaggedCategories.join(", ")}`);
  } else {
    console.log("✅ Content appears safe");
  }

  // 2. Examine category scores (0.0 to 1.0, higher = more likely)
  const scores = result.categoryScores;
  console.log("\nConfidence Scores:");
  console.log(`- Violence score: ${scores["violence"]?.toFixed(4)}`);
  console.log(`- Sexual content score: ${scores["sexual"]?.toFixed(4)}`);
  console.log(`- Harassment score: ${scores["harassment"]?.toFixed(4)}`);

  // 3. Get boolean flags for each category
  const categories = result.categories;
  console.log("\nCategory Flags:");
  console.log(`- Contains violence: ${categories["violence"]}`);
  console.log(`- Contains self-harm: ${categories["self-harm"]}`);
  
  // 4. Ruby-compatible aliases also work
  console.log(`\n(Ruby-alias) Flagged categories: ${result.flagged_categories.join(", ")}`);
}

main().catch(console.error);
