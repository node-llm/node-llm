import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });
  const chat = llm.chat("amazon.nova-lite-v1:0");

  console.log("=== Streaming Example ===");

  process.stdout.write("Streaming: ");
  const stream = chat.stream("Tell me a short story about a robot learning to paint in 3 sentences.");
  
  let result = "";
  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
      result += chunk.content;
    }
  }
  process.stdout.write("\n\nDone.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
