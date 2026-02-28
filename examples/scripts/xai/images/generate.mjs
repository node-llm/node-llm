import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("xai");

  console.log("Generating image with xAI...");
  const response = await llm.paint("A highly detailed futuristic cityscape at night, cyberpunk style", {
    model: "grok-imagine-image"
  });

  console.log("\nResponse:");
  console.log(`Image URL: ${response.url}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
