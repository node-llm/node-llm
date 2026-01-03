import { NodeLLM } from "../../../packages/core/dist/index.js";
import "dotenv/config";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });

  const chat = NodeLLM.chat("deepseek-reasoner");

  console.log("--- Reasoning (Non-Streaming) ---");
  const response = await chat.ask("What is heavier: 1kg of feathers or 1kg of lead? Explain your reasoning.");
  
  if (response.reasoning) {
    console.log("\x1b[33m[REASONING]\x1b[0m");
    console.log(response.reasoning);
    console.log("\x1b[33m--- end of reasoning ---\x1b[0m\n");
  }

  console.log("\x1b[32m[ANSWER]\x1b[0m");
  console.log(response.content);
  console.log("---------------------------------\n");

  console.log("--- Reasoning (Streaming) ---");
  let fullReasoning = "";
  let fullContent = "";

  for await (const chunk of chat.stream("If I have 3 oranges and eat 1, how many do I have left?")) {
    if (chunk.reasoning) {
      process.stdout.write(`\x1b[33m${chunk.reasoning}\x1b[0m`);
      fullReasoning += chunk.reasoning;
    }
    if (chunk.content) {
      if (fullReasoning && !fullContent) {
           process.stdout.write("\n\n\x1b[32m[ANSWER]\x1b[0m\n");
      }
      process.stdout.write(chunk.content);
      fullContent += chunk.content;
    }
  }
  console.log("\n-----------------------------");
}

main().catch(console.error);
